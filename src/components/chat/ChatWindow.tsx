'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, Loader2, MessageSquare, Check, CheckCheck, Trash2 } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'
import { getMessageHistory, sendMessageAction, deleteConversation } from '@/actions/chat-actions'
import type { ChatMessage, ChatContact } from '@/actions/chat-actions'

interface Props {
  currentUserId: string
  recipient: ChatContact | null
  isAdmin?: boolean
  onClearRecipient?: () => void
}

export default function ChatWindow({ currentUserId, recipient, isAdmin = false, onClearRecipient }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isSending, startTransition] = useTransition()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const focusInput = () => {
    // Small delay to ensure DOM is stable before focusing
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Load History
  useEffect(() => {
    if (!recipient) {
      setMessages([])
      return
    }

    let isMounted = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)

    getMessageHistory(recipient.id).then(({ data, error }) => {
      if (!isMounted) return
      if (error) {
        console.error('Failed to load history:', error)
      } else {
        setMessages(data)
        setTimeout(scrollToBottom, 100)
      }
      setIsLoading(false)
      // Auto-focus input when conversation loads
      focusInput()
    })

    return () => {
      isMounted = false
    }
  }, [recipient])

  // Real-Time Subscription — INSERT, UPDATE, DELETE
  useEffect(() => {
    if (!recipient) return

    const channelName = `chat_${[currentUserId, recipient.id].sort().join('_')}`

    const channel = supabase
      .channel(channelName)
      // New message received
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage
        const isRelevant =
          (newMsg.sender_id === currentUserId && newMsg.receiver_id === recipient.id) ||
          (newMsg.sender_id === recipient.id && newMsg.receiver_id === currentUserId)

        if (isRelevant) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            // If current user sent this, check if an optimistic temp message exists to replace
            const tempIndex = prev.findIndex(
              (m) =>
                m.id.startsWith('temp_') &&
                m.sender_id === newMsg.sender_id &&
                m.content === newMsg.content
            )
            if (tempIndex !== -1) {
              const copy = [...prev]
              copy[tempIndex] = newMsg
              return copy
            }
            return [...prev, newMsg]
          })
          setTimeout(scrollToBottom, 100)
        }
      })
      // Message updated (e.g., is_read, deleted_by_* flags changed)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updated = payload.new as ChatMessage
        setMessages((prev) =>
          prev
            .map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
            // Filter out if the current user's soft-delete flag just turned true
            .filter((m) => {
              if (m.sender_id === currentUserId && m.deleted_by_sender) return false
              if (m.receiver_id === currentUserId && m.deleted_by_receiver) return false
              return true
            })
        )
      })
      // Message hard-deleted (admin action)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        const deletedId = (payload.old as { id: string }).id
        setMessages((prev) => prev.filter((m) => m.id !== deletedId))
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error on', channelName, err)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, recipient])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipient || !inputValue.trim() || isSending) return

    const content = inputValue.trim()
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: recipient.id,
      content,
      is_read: false,
      deleted_by_sender: false,
      deleted_by_receiver: false,
      created_at: new Date().toISOString(),
    }

    // Instant local UI feedback (WhatsApp-style instant message render)
    setMessages((prev) => [...prev, optimisticMessage])
    setInputValue('')
    setTimeout(scrollToBottom, 50)

    startTransition(async () => {
      const { success, data, error } = await sendMessageAction(recipient.id, content)
      if (!success) {
        // Rollback optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        setInputValue(content)
        alert(error || 'Failed to send message')
      } else if (data) {
        // Replace temporary optimistic message with confirmed database record
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) {
            return prev.filter((m) => m.id !== tempId)
          }
          return prev.map((m) => (m.id === tempId ? data : m))
        })
      }
      // Always re-focus after send attempt
      focusInput()
    })
  }

  const handleDeleteConversation = async () => {
    if (!recipient) return
    const confirmText = isAdmin
      ? 'This will permanently delete this conversation for everyone from the database. This cannot be undone.'
      : 'This will clear this conversation for you. Other participants will still be able to see their messages.'
    if (!window.confirm(confirmText)) {
      return
    }

    const { success, error } = await deleteConversation(recipient.id)
    if (success) {
      if (onClearRecipient) onClearRecipient()
      setMessages([])
    } else {
      alert(error || 'Failed to delete conversation')
    }
  }

  if (!recipient) {
    return (
      <div className="flex-1 surface-card border-hairline rounded-[2rem] p-8 flex flex-col items-center justify-center text-center h-full min-h-[500px] shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-ink border border-hairline flex items-center justify-center mb-8 shadow-inner">
          <MessageSquare className="w-12 h-12 text-mist/50" />
        </div>
        <h2 className="font-display text-2xl font-bold text-parchment mb-3">Your Messages</h2>
        <p className="text-mist text-sm max-w-sm leading-relaxed">
          Select a contact from the directory to start a secure, real-time conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 surface-card border-hairline rounded-[2rem] flex flex-col h-full min-h-[500px] max-h-[800px] overflow-hidden shadow-2xl">
      {/* ── Header ── */}
      <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-veena-blue/10 border border-veena-blue/20 flex items-center justify-center text-veena-blue font-bold text-lg shrink-0 shadow-inner">
            {recipient.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-parchment leading-tight">{recipient.full_name}</h2>
            <div className="text-[10px] font-mono text-mist uppercase tracking-widest mt-1">
              {recipient.role} {recipient.extraInfo && ` • ${recipient.extraInfo}`}
            </div>
          </div>
        </div>

        <button
          onClick={handleDeleteConversation}
          title={isAdmin ? 'Delete Conversation for Everyone' : 'Clear Conversation for Me'}
          className="p-2 text-mist hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 styled-scroll">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-veena-blue" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-mist opacity-60">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-[10px] font-mono uppercase tracking-widest">Say hello to {recipient.full_name}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId

            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-lg ${
                    isMine
                      ? 'bg-veena-blue text-ink rounded-br-sm'
                      : 'bg-ink border border-hairline text-parchment rounded-bl-sm'
                  }`}
                >
                  <p className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${isMine ? 'font-medium' : ''}`}>
                    {msg.content}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2 px-1">
                  <span className="text-[10px] font-mono text-mist uppercase tracking-widest">
                    {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  {isMine && (
                    msg.is_read ? <CheckCheck className="w-3.5 h-3.5 text-veena-blue" /> : <Check className="w-3.5 h-3.5 text-mist" />
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="p-5 bg-surface border-t border-hairline shrink-0">
        <form onSubmit={handleSend} className="flex gap-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${recipient.full_name}...`}
            className="flex-1 input-glass rounded-xl px-5 py-3.5 text-sm text-parchment placeholder-mist focus:outline-none focus:border-veena-blue transition-colors shadow-inner"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="w-14 h-14 rounded-xl bg-veena-blue text-ink flex items-center justify-center shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shrink-0"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </button>
        </form>
      </div>
    </div>
  )
}
