import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { dispatchPasswordChangedAlert } from '@/utils/notification-dispatcher'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let bodyName: string | undefined
    try {
      const body = await request.json()
      bodyName = body?.name
    } catch {
      // Body is optional
    }

    const email = user.email
    const userId = user.id
    const userName = bodyName || (user.user_metadata?.full_name as string) || 'User'

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
