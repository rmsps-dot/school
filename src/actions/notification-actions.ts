'use server'

import { createClient } from '@/utils/supabase/server'
import { withErrorDetector } from '@/utils/ErrorDetector'

export interface SidebarCounts {
  messages: number
  requests?: number
  results?: number
  leaves?: number
}

/**
 * Fetches all notification badge counts for the currently logged-in user.
 * Admin gets all counts. Others only get message counts.
 */
export const getSidebarCounts = withErrorDetector('getSidebarCounts', async (): Promise<{ data: SidebarCounts | null; error?: string }> => {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_sidebar_counts')

  if (error) {
    return { data: null, error: error.message }
  }

  // Count distinct senders with unread messages (WhatsApp-style: 1 unread conversation = 1 badge)
  let unreadChatCount = data?.messages || 0
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: unreadRows } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .eq('deleted_by_receiver', false)
      if (unreadRows) {
        unreadChatCount = new Set(unreadRows.map((r) => r.sender_id)).size
      }
    }
  } catch {
    // fallback to rpc count if error
  }

  // Ensure default structure if the RPC returns null for some reason
  const counts: SidebarCounts = {
    messages: unreadChatCount,
    requests: data?.requests || 0,
    leaves: data?.leaves || 0,
    results: data?.results || 0,
  }

  return { data: counts }
})
