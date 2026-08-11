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

  // 1. Get current user
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { data: null, error: 'Unauthenticated' }

  // 2. Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return { data: null, error: 'Profile not found' }

  const counts: SidebarCounts = { messages: 0 }

  // 3. Get unread messages count (For ALL roles)
  const { count: msgCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)
  
  counts.messages = msgCount || 0

  // 4. Admin-specific counts
  if (profile.role === 'admin') {
    // 4a. Pending Registrations
    const { count: reqCount } = await supabase
      .from('pending_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    counts.requests = reqCount || 0

    // 4b. Pending Leave Requests
    const { count: leaveCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    counts.leaves = leaveCount || 0

    // 4c. Pending Results (Not Approved OR Has Edit Request OR Has Delete Request)
    const { count: resultsCount } = await supabase
      .from('results')
      .select('*', { count: 'exact', head: true })
      .or('is_approved.eq.false,edit_request.not.is.null,delete_request.eq.true')
    counts.results = resultsCount || 0
  }

  return { data: counts }
})
