import { type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { resolveStudentParentContact } from '@/utils/notification-dispatcher'
import { sendFeeReminderEmail } from '@/utils/mailer'
import { sendPushNotification } from '@/utils/web-push'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/monthly-master
 *
 * Monthly Master Cron Job.
 * Runs at midnight on the 1st of every month (0 0 1 * *)
 *
 * Tasks:
 * 1. Fee Generation: Creates new fee records for all active students.
 * 2. Salary Generation: Creates new pending salary records for all active teachers.
 * 3. Overdue Reminders: Processes and sends reminders for all unpaid fees.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[monthly-master] CRON_SECRET env var is not set! Route is disabled.')
    return Response.json({ error: 'Cron route not configured.' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const results: any = {}
  const now = new Date()
  const currentMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 10).toISOString().split('T')[0] // 10th of the month

  // ============================================================================
  // TASK 1: Fee Generation
  // ============================================================================
  try {
    const { data: students } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        student_id,
        classes (
          id,
          monthly_fee
        )
      `)

    if (students && students.length > 0) {
      const feeRecords = students
        .filter((s) => {
          const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes
          return cls && (cls as any).monthly_fee > 0
        })
        .map((s) => {
          const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes
          return {
            student_id: s.student_id,
            fee_name: `Tuition Fee - ${currentMonth}`,
            amount: (cls as any).monthly_fee,
            due_date: dueDate,
            status: 'due',
            paid_amount: 0,
          }
        })

      if (feeRecords.length > 0) {
        const { error: feeError } = await supabaseAdmin.from('student_fees').insert(feeRecords)
        if (feeError) console.error('[monthly-master] Fee generation error:', feeError.message)
        else results.feesGenerated = feeRecords.length
      } else {
        results.feesGenerated = 0
      }
    }
  } catch (error: any) {
    console.error('[monthly-master] Fee generation failed:', error)
    results.feeError = error.message
  }

  // ============================================================================
  // TASK 2: Salary Generation
  // ============================================================================
  try {
    const { data: teachers } = await supabaseAdmin
      .from('teachers')
      .select('id, base_salary')

    if (teachers && teachers.length > 0) {
      const salaryRecords = teachers
        .filter((t) => t.base_salary > 0)
        .map((t) => ({
          teacher_id: t.id,
          remarks: `Salary for ${currentMonth}`,
          amount: t.base_salary,
          status: 'pending',
          payment_date: new Date().toISOString().split('T')[0],
        }))

      if (salaryRecords.length > 0) {
        const { error: salaryError } = await supabaseAdmin.from('teacher_payments').insert(salaryRecords)
        if (salaryError) console.error('[monthly-master] Salary generation error:', salaryError.message)
        else results.salariesGenerated = salaryRecords.length
      } else {
        results.salariesGenerated = 0
      }
    }
  } catch (error: any) {
    console.error('[monthly-master] Salary generation failed:', error)
    results.salaryError = error.message
  }

  // ============================================================================
  // TASK 3: Overdue Reminders (Formerly fee-reminders)
  // ============================================================================
  try {
    const { data: dueFees, error } = await supabaseAdmin
      .from('student_fees')
      .select('*')
      .neq('status', 'paid')
      .order('due_date', { ascending: true })

    if (error) throw error

    if (dueFees && dueFees.length > 0) {
      const studentFeeMap = new Map<string, any>()
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
            console.warn('[monthly-master] Failed to process reminder:', subErr)
          }
        })
      )
      results.remindersSent = sentCount
    } else {
      results.remindersSent = 0
    }
  } catch (error: any) {
    console.error('[monthly-master] Reminder task failed:', error)
    results.reminderError = error.message
  }

  return Response.json({ success: true, results })
}
