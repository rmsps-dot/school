import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { getUnreadCounts } from '@/actions/chat-actions'

export function useUnreadCounts(currentUserId: string) {
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    let isMounted = true

    getUnreadCounts().then(({ data, error }) => {
      if (isMounted && data) {
        setUnreadCounts(data.bySender)
      }
    })

    // Realtime subscription for ALL incoming messages to this user
    const channel = supabase.channel(`sidebar_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          const newMsg = payload.new
          setUnreadCounts(prev => ({
            ...prev,
            [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1
          }))
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const clearUnreadCount = (senderId: string) => {
    setUnreadCounts(prev => ({ ...prev, [senderId]: 0 }))
  }

  return { unreadCounts, clearUnreadCount }
}
