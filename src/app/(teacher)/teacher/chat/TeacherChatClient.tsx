'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, GraduationCap, Heart, Shield, Search, MessageSquare, Loader2 } from 'lucide-react'
import ChatWindow from '@/components/chat/ChatWindow'
import { getContactsForTeacher } from '@/actions/chat-actions'
import { useUnreadCounts } from '@/hooks/useUnreadCounts'
import type { ChatContact } from '@/actions/chat-actions'

interface ClassInfo {
  id: string
  class_name: string
  section: string
}

interface Props {
  currentUserId: string
  schoolClasses: ClassInfo[]
}

const TABS = [
  { id: 'teachers', label: 'Teachers', icon: Users, color: 'text-sky-400' },
  { id: 'students', label: 'Students', icon: GraduationCap, color: 'text-emerald-400' },
  { id: 'parents', label: 'Parents', icon: Heart, color: 'text-pink-400' },
  { id: 'admin', label: 'Admin', icon: Shield, color: 'text-amber-400' },
]

export default function TeacherChatClient({ currentUserId, schoolClasses }: Props) {
  const [activeTab, setActiveTab] = useState('teachers')
  const [selectedClassId, setSelectedClassId] = useState<string>(schoolClasses[0]?.id || '')
  
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)
  const { unreadCounts, clearUnreadCount } = useUnreadCounts(currentUserId)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    
    getContactsForTeacher(activeTab, selectedClassId).then(({ data, error }) => {
      if (!isMounted) return
      if (error) console.error(error)
      else setContacts(data)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [activeTab, selectedClassId])

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
      <div className="w-full lg:w-96 flex flex-col gap-4">
        
        {/* Tab Selector */}
        <div className="surface-card rounded-2xl p-2 grid grid-cols-4 gap-1 border border-hairline">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setSearchQuery('')
              }}
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${
                activeTab === tab.id ? 'text-parchment' : 'text-mist hover:text-parchment hover:bg-white/[0.02]'
              }`}
            >
              <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? tab.color : 'text-mist/50'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeChatTab"
                  className="absolute inset-0 bg-white/5 rounded-xl border border-hairline"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Class Dropdown (Only for Students & Parents) */}
        <AnimatePresence>
          {(activeTab === 'students' || activeTab === 'parents') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="surface-card rounded-xl p-3 border border-hairline">
                <label className="text-xs font-bold text-mist uppercase tracking-wider ml-1 mb-1.5 block">
                  Select Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-ink border border-hairline rounded-lg px-3 py-2 text-parchment text-sm focus:outline-none focus:border-coral/60 cursor-pointer"
                >
                  {schoolClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      Class {cls.class_name} — Sec {cls.section}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact List */}
        <div className="surface-card rounded-2xl flex-1 flex flex-col overflow-hidden border border-hairline">
          <div className="p-4 border-b border-hairline">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
              <input
                type="text"
                placeholder="Search names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full input-glass rounded-xl pl-9 pr-4 py-2.5 text-sm text-parchment placeholder-mist/50 focus:outline-none focus:border-coral/60 transition-colors"
              />
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
                          ? 'bg-coral shadow-lg shadow-coral/20' 
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 relative ${
                        isSelected ? 'bg-ink/20 text-ink' : 'bg-ink text-mist border border-hairline'
                      }`}>
                        {contact.full_name.charAt(0).toUpperCase()}
                        {unreadCount > 0 && !isSelected && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-ink">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-ink' : 'text-parchment'}`}>
                          {contact.full_name}
                        </p>
                        <p className={`text-xs truncate font-mono ${isSelected ? 'text-ink/70' : 'text-mist'}`}>
                          {contact.extraInfo || contact.role}
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
