import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase/client'
import { getUnreadCounts, markMessagesAsReadAction } from '@/actions/chat-actions'

export function useUnreadCounts(currentUserId: string) {
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({})
  const [unreadByRole, setUnreadByRole] = useState<{ [key: string]: number }>({})
  const [totalUnreadChats, setTotalUnreadChats] = useState<number>(0)

  const refreshCounts = useCallback(async () => {
    const { data } = await getUnreadCounts()
    if (data) {
      setUnreadCounts(data.bySender)
      setUnreadByRole(data.byRole)
      setTotalUnreadChats(data.total)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    getUnreadCounts().then(({ data }) => {
      if (isMounted && data) {
        setUnreadCounts(data.bySender)
        setUnreadByRole(data.byRole)
        setTotalUnreadChats(data.total)
      }
    })

    // Listen to local messages-read events from other components
    const handleReadEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ senderId: string }>
      const senderId = customEvent.detail?.senderId
      if (senderId) {
        setUnreadCounts((prev) => {
          if (!prev[senderId]) return prev
          const copy = { ...prev }
          delete copy[senderId]
          return copy
        })
      }
      refreshCounts()
    }
    window.addEventListener('messages-read', handleReadEvent)

    // Realtime subscription for ALL incoming messages or updates to this user
    const channel = supabase
      .channel(`sidebar_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        () => {
          refreshCounts()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        () => {
          refreshCounts()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      window.removeEventListener('messages-read', handleReadEvent)
      supabase.removeChannel(channel)
    }
  }, [currentUserId, refreshCounts])

  const clearUnreadCount = useCallback(
    async (senderId: string) => {
      // 1. Instant optimistic local UI clear
      setUnreadCounts((prev) => {
        if (!prev[senderId]) return prev
        const copy = { ...prev }
        delete copy[senderId]
        return copy
      })

      // 2. Dispatch event for sidebar and other tabs to update instantly
      window.dispatchEvent(new CustomEvent('messages-read', { detail: { senderId } }))

      // 3. Persist read state in the database
      await markMessagesAsReadAction(senderId)

      // 4. Resync counts from database
      refreshCounts()
    },
    [refreshCounts]
  )

  return { unreadCounts, unreadByRole, totalUnreadChats, clearUnreadCount, refreshCounts }
}
