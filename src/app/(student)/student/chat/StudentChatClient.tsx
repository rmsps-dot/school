'use client'

import { useState, useEffect } from 'react'
import { Search, MessageSquare, Loader2, Users } from 'lucide-react'
import ChatWindow from '@/components/chat/ChatWindow'
import { getStaffContacts } from '@/actions/chat-actions'
import { useUnreadCounts } from '@/hooks/useUnreadCounts'
import type { ChatContact } from '@/actions/chat-actions'

interface Props {
  currentUserId: string
}

export default function StudentChatClient({ currentUserId }: Props) {
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const { unreadCounts, clearUnreadCount } = useUnreadCounts(currentUserId)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    
    getStaffContacts().then(({ data, error }) => {
      if (!isMounted) return
      if (error) console.error(error)
      else setContacts(data || [])
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredContacts = contacts
    .filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const countA = unreadCounts[a.id] || 0
      const countB = unreadCounts[b.id] || 0
      if (countA > 0 && countB === 0) return -1
      if (countB > 0 && countA === 0) return 1
      return 0
    })

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[80vh] min-h-[600px]">
      
      {/* ── Left Sidebar (Contacts) ── */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="surface-card border-hairline rounded-[2rem] flex-1 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-hairline bg-surface">
            <h2 className="text-[10px] font-mono text-mist uppercase tracking-widest mb-4 ml-1">Staff Directory</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
              <input
                type="text"
                placeholder="Search teachers & admins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full input-glass rounded-xl pl-10 pr-4 py-3 text-sm text-parchment placeholder-mist focus:outline-none focus:border-veena-blue transition-colors shadow-inner"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 styled-scroll">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-veena-blue" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-mist">
                <Users className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-[10px] font-mono uppercase tracking-widest">No staff found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map(contact => {
                  const isSelected = selectedContact?.id === contact.id
                  const unreadCount = unreadCounts[contact.id] || 0
                  
                  return (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSelectedContact(contact)
                        // Optimistically clear unread count
                        if (unreadCount > 0) {
                          clearUnreadCount(contact.id)
                        }
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isSelected 
                          ? 'bg-veena-blue/10 border border-veena-blue/20 shadow-inner' 
                          : 'hover:bg-surface/50 border border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 relative shadow-inner ${
                        isSelected ? 'bg-veena-blue text-ink' : 'bg-ink border border-hairline text-mist'
                      }`}>
                        {contact.full_name.charAt(0).toUpperCase()}
                        {unreadCount > 0 && !isSelected && (
                          <span className="absolute -top-1 -right-1 bg-coral text-ink text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-surface">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-parchment' : 'text-parchment/80'}`}>
                          {contact.full_name}
                        </p>
                        <p className={`text-[10px] font-mono truncate uppercase tracking-widest mt-1 ${isSelected ? 'text-veena-blue' : 'text-mist'}`}>
                          {contact.role}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Sidebar (Chat Window) ── */}
      <div className="flex-1 min-w-0">
        <ChatWindow currentUserId={currentUserId} recipient={selectedContact} onClearRecipient={() => setSelectedContact(null)} />
      </div>

    </div>
  )
}
