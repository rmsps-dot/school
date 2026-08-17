'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, Loader2, MessageSquare, Check, CheckCheck, Trash2 } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'
import { getMessageHistory, sendMessageAction, deleteConversation } from '@/actions/chat-actions'
import type { ChatMessage, ChatContact } from '@/actions/chat-actions'

interface Props {
  currentUserId: string
  recipient: ChatContact | null
  onClearRecipient?: () => void
}

export default function ChatWindow({ currentUserId, recipient, onClearRecipient }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isSending, startTransition] = useTransition()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        // Scroll to bottom after state update
        setTimeout(scrollToBottom, 100)
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [recipient])

  // Real-Time Subscription
  useEffect(() => {
    if (!recipient) return

    // Create a unique channel for this recipient to avoid overlapping listeners
    const channelName = `chat_${currentUserId}_${recipient.id}`
    
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          
          // CRUCIAL: Only append if the message belongs to this specific 1-on-1 conversation
          const isRelevant = 
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === recipient.id) ||
            (newMsg.sender_id === recipient.id && newMsg.receiver_id === currentUserId)

          if (isRelevant) {
            setMessages((prev) => {
              // Prevent duplicates (Supabase sometimes fires multiple events locally)
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            setTimeout(scrollToBottom, 100)
          }
        }
      )
      .subscribe()

    return () => {
      // Prevent memory leaks
      supabase.removeChannel(channel)
    }
  }, [currentUserId, recipient])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipient || !inputValue.trim() || isSending) return

    const content = inputValue.trim()
    setInputValue('') // Optimistic clear

    startTransition(async () => {
      const { success, error } = await sendMessageAction(recipient.id, content)
      if (!success) {
        alert(error || 'Failed to send message')
        setInputValue(content) // Restore input on failure
      }
    })
  }

  const handleDeleteConversation = async () => {
    if (!recipient) return
    if (!window.confirm('This will permanently delete this conversation for both users. This cannot be undone.')) {
      return
    }

    const { success, error } = await deleteConversation(recipient.id)
    if (success) {
      if (onClearRecipient) onClearRecipient()
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
          title="Delete Conversation"
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
                  <p className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${isMine ? 'font-medium' : ''}`}>{msg.content}</p>
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
