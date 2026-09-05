'use client'

import { useState, useEffect } from 'react'
import { Users, Search, MessageSquare, Loader2 } from 'lucide-react'
import ChatWindow from '@/components/chat/ChatWindow'
import { getAllProfiles } from '@/actions/chat-actions'
import { useUnreadCounts } from '@/hooks/useUnreadCounts'
import type { ChatContact } from '@/actions/chat-actions'
import { useSearchParams } from 'next/navigation'

interface Props {
  currentUserId: string
}

export default function AdminChatClient({ currentUserId }: Props) {
  const searchParams = useSearchParams()
  const initialContactId = searchParams.get('with')

  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)
  const { unreadCounts, clearUnreadCount } = useUnreadCounts(currentUserId)

  useEffect(() => {
    let isMounted = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    
    getAllProfiles().then(({ data, error }) => {
      if (!isMounted) return
      if (error) console.error(error)
      else {
        setContacts(data)
        // Auto-select if ?with=id is provided
        if (initialContactId) {
          const found = data.find(c => c.id === initialContactId)
          if (found) setSelectedContact(found)
        }
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [initialContactId])

  const filteredContacts = contacts
    .filter(c => {
      const matchesSearch = c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || c.role === roleFilter
      return matchesSearch && matchesRole && c.id !== currentUserId
    })
    .sort((a, b) => {
      const countA = unreadCounts[a.id] || 0
      const countB = unreadCounts[b.id] || 0
      if (countA > 0 && countB === 0) return -1
      if (countB > 0 && countA === 0) return 1
      return 0 // keep original sort order otherwise
    })

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[80vh] min-h-[600px]">
      
      {/* ── Left Sidebar (Contacts) ── */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        
        {/* Contact List */}
        <div className="glass rounded-2xl flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-hairline space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
              <input
                type="text"
                placeholder="Search all users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full input-glass rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-coral transition-colors"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {['all', 'teacher', 'student', 'parent', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 transition-colors ${
                    roleFilter === role ? 'bg-coral text-white' : 'bg-white/5 text-mist hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-coral" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-mist">
                <Users className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-medium uppercase tracking-wider">No contacts found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredContacts.map(contact => {
                  const isSelected = selectedContact?.id === contact.id
                  const unreadCount = unreadCounts[contact.id] || 0
                  
                  return (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSelectedContact(contact)
                        if (unreadCount > 0) clearUnreadCount(contact.id)
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isSelected 
                          ? 'bg-coral shadow-lg shadow-indigo-500/20' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 relative ${
                        isSelected ? 'bg-white/20 text-white' : 'surface-card text-parchment'
                      }`}>
                        {contact.full_name.charAt(0).toUpperCase()}
                        {unreadCount > 0 && !isSelected && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-hairline">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-parchment'}`}>
                          {contact.full_name}
                        </p>
                        <p className={`text-xs truncate uppercase tracking-wider font-semibold mt-0.5 ${isSelected ? 'text-gold' : 'text-mist'}`}>
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
        <ChatWindow currentUserId={currentUserId} recipient={selectedContact} isAdmin={true} onClearRecipient={() => setSelectedContact(null)} />
      </div>

    </div>
  )
}
