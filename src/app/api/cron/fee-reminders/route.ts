import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { resolveStudentParentContact } from '@/utils/notification-dispatcher'
import { sendFeeReminderEmail } from '@/utils/mailer'
import { sendPushNotification } from '@/utils/web-push'
import type { Database } from '@/types/supabase'

type FeeRow = Database['public']['Tables']['student_fees']['Row']

export async function GET(request: Request) {
  // Optional security check for Vercel Cron or secret header
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: dueFees, error } = await supabaseAdmin
      .from('student_fees')
      .select('*')
      .neq('status', 'paid')
      .order('due_date', { ascending: true })

    if (error) throw error
    if (!dueFees || dueFees.length === 0) {
      return NextResponse.json({ success: true, processedCount: 0, sentCount: 0 })
    }

    // Group fees by student
    const studentFeeMap = new Map<string, FeeRow>()
    for (const fee of dueFees) {
      const balance = fee.amount - (fee.paid_amount || 0)
      if (balance > 0) {
        if (!studentFeeMap.has(fee.student_id)) {
          studentFeeMap.set(fee.student_id, fee)
        }
      }
    }

    const uniqueFees = Array.from(studentFeeMap.values())
    let sentCount = 0

    await Promise.allSettled(
      uniqueFees.map(async (fee) => {
        try {
          const contact = await resolveStudentParentContact(fee.student_id)
          if (!contact) return

          if (contact.email) {
            await sendFeeReminderEmail({
              toEmail: contact.email,
              parentName: contact.parentName,
              studentName: contact.studentName,
              className: contact.className,
              feeName: fee.fee_name,
              amount: fee.amount,
              paidAmount: fee.paid_amount || 0,
              dueDate: fee.due_date,
            })
            sentCount++
          }

          const pushTargets = [contact.parentUserId, contact.profileId].filter(
            (id): id is string => Boolean(id)
          )
          if (pushTargets.length > 0) {
            await sendPushNotification(pushTargets, {
              title: 'Fee Reminder',
              body: `Fee reminder for ${contact.studentName}: ${fee.fee_name} is due on ${fee.due_date}.`,
              url: '/parent/fees',
              tag: `fee-reminder-${fee.id}`,
            })
          }
        } catch (subErr) {
          console.warn('Failed to process cron fee reminder:', subErr)
        }
      })
    )

    return NextResponse.json({
      success: true,
      processedCount: uniqueFees.length,
      sentCount,
    })
  } catch (err) {
    console.error('Error in fee-reminders cron route:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
