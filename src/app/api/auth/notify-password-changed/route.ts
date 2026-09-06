import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { dispatchPasswordChangedAlert } from '@/utils/notification-dispatcher'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let bodyEmail: string | undefined
    let bodyName: string | undefined

    try {
      const body = await request.json()
      bodyEmail = body?.email
      bodyName = body?.name
    } catch {
      // Body is optional
    }

    const email = bodyEmail || user?.email
    let userId = user?.id
    let userName = bodyName || (user?.user_metadata?.full_name as string) || 'User'

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email not provided' }, { status: 400 })
    }

    if (!userId) {
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const matched = userData?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
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

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in notify-password-changed route:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
