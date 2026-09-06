'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { requireSelfOrGuardianOf, requireAdmin } from '@/utils/auth-helpers'
import { resolveStudentParentContact } from '@/utils/notification-dispatcher'
import { sendFeeReminderEmail } from '@/utils/mailer'
import { sendPushNotification } from '@/utils/web-push'
import type { Database } from '@/types/supabase'

export type FeeRecord = Database['public']['Tables']['student_fees']['Row'] & {
  status: 'paid' | 'due' | 'upcoming'
}

export async function getStudentFees(studentIdStr: string): Promise<{ data: FeeRecord[]; error?: string }> {
  try {
    const auth = await requireSelfOrGuardianOf(studentIdStr, { allowAdmin: true, allowTeacher: true })
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('student_fees')
      .select('*')
      .eq('student_id', studentIdStr)
      .order('due_date', { ascending: true })

    if (error) throw error

    return { data: (data ?? []) as FeeRecord[] }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Month-end Fee Reminder Dispatcher.
 * Queries all student fee rows with pending balances and sends reminder emails & push alerts to parents.
 */
export async function sendMonthEndFeeReminders(): Promise<{
  success: boolean
  processedCount: number
  sentCount: number
  error?: string
}> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, processedCount: 0, sentCount: 0, error: auth.error }

    // Fetch all fees where status is 'due' or pending balance > 0
    const { data: dueFees, error } = await supabaseAdmin
      .from('student_fees')
      .select('*')
      .neq('status', 'paid')
      .order('due_date', { ascending: true })

    if (error) throw new Error(error.message)
    if (!dueFees || dueFees.length === 0) {
      return { success: true, processedCount: 0, sentCount: 0 }
    }

    let sentCount = 0

    // Group fees by student to avoid duplicate emails for same student
    const studentFeeMap = new Map<string, FeeRecord>()
    for (const fee of dueFees) {
      const balance = fee.amount - (fee.paid_amount || 0)
      if (balance > 0) {
        if (!studentFeeMap.has(fee.student_id)) {
          studentFeeMap.set(fee.student_id, fee as FeeRecord)
        }
      }
    }

    const uniqueFees = Array.from(studentFeeMap.values())

    await Promise.allSettled(
      uniqueFees.map(async (fee) => {
        try {
          const contact = await resolveStudentParentContact(fee.student_id)
          if (!contact) return

          // Send Reminder Email
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

          // Send Push Alert
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
          console.warn('Failed to send individual fee reminder:', subErr)
        }
      })
    )

    return {
      success: true,
      processedCount: uniqueFees.length,
      sentCount,
    }
  } catch (err) {
    console.error('sendMonthEndFeeReminders error:', err)
    return {
      success: false,
      processedCount: 0,
      sentCount: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
