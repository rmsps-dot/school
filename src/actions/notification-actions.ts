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

  // Ensure default structure if the RPC returns null for some reason
  const counts: SidebarCounts = {
    messages: data?.messages || 0,
    requests: data?.requests || 0,
    leaves: data?.leaves || 0,
    results: data?.results || 0,
  }

  return { data: counts }
})
