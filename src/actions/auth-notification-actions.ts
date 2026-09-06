'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { dispatchPasswordChangedAlert } from '@/utils/notification-dispatcher'

/**
 * Server action called whenever a user password change is completed.
 * Dispatches an automated security notification email and push alert to the account owner.
 */
export async function notifyPasswordChanged(
  targetEmail?: string,
  targetName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let email = targetEmail || user?.email
    let userId = user?.id
    let userName = targetName || (user?.user_metadata?.full_name as string) || 'User'

    // If no user in current cookie session (e.g. during reset-password callback before signin)
    if (!email && targetEmail) {
      email = targetEmail
    }

    if (!email) {
      return { success: false, error: 'User email not found' }
    }

    // Try to resolve user ID and name if only email was provided
    if (!userId) {
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })
      const matched = userData?.users.find((u) => u.email?.toLowerCase() === email?.toLowerCase())
      if (matched) {
        userId = matched.id
        userName = (matched.user_metadata?.full_name as string) || userName
      }
    }

    await dispatchPasswordChangedAlert({
      userEmail: email,
      userName,
      userId,
    })

    return { success: true }
  } catch (err) {
    console.warn('Error in notifyPasswordChanged server action:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send security alert',
    }
  }
}
