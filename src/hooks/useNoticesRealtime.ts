import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import type { Notice } from '@/actions/notice-actions'

/**
 * Subscribes to real-time changes on the `notices` table.
 * Returns a live-updating array of notices, starting from `initialNotices`.
 * Handles INSERT, UPDATE, and DELETE events.
 */
export function useNoticesRealtime(initialNotices: Notice[]): Notice[] {
  const [notices, setNotices] = useState<Notice[]>(initialNotices)
  const [prevInitial, setPrevInitial] = useState<Notice[]>(initialNotices)

  // React official pattern: adjust state during rendering when prop changes
  if (prevInitial !== initialNotices) {
    setPrevInitial(initialNotices)
    setNotices(initialNotices)
  }

  useEffect(() => {
    const channel = supabase
      .channel('notices_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notices' },
        (payload) => {
          const newNotice = payload.new as Notice
          setNotices((prev) => {
            // Prevent duplicates
            if (prev.some((n) => n.id === newNotice.id)) return prev
            // Newest first
            return [newNotice, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notices' },
        (payload) => {
          const updated = payload.new as Notice
          setNotices((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notices' },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          setNotices((prev) => prev.filter((n) => n.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return notices
}
