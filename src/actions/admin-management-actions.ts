'use server'

import { supabaseAdmin } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/utils/auth-helpers'
import type { Database } from '@/types/supabase'
import {
  dispatchAttendanceAlert,
  dispatchFeePaymentAlert,
  dispatchTeacherPaymentAlert,
  dispatchTeacherAbsentAlert,
} from '@/utils/notification-dispatcher'

/* ════════════════════════════════════════════════════════════
   1. TEACHER ATTENDANCE ACTIONS
════════════════════════════════════════════════════════════ */

export async function editTeacherAttendanceStatus(
  id: string,
  status: Database['public']['Enums']['attendance_status']
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Fetch record details before update for notification dispatch
    const { data: currentAtt } = await supabase
      .from('teacher_attendance')
      .select('teacher_id, date')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabase
      .from('teacher_attendance')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    // If marked absent, dispatch email & push alert to teacher
    if (status === 'absent' && currentAtt) {
      dispatchTeacherAbsentAlert({
        teacherId: currentAtt.teacher_id,
        date: currentAtt.date,
      }).catch((e) => console.warn('Background teacher absent dispatch error:', e))
    }

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update attendance' }
  }
}

export async function deleteTeacherAttendance(id: string) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
      .from('teacher_attendance')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete attendance' }
  }
}

/* ════════════════════════════════════════════════════════════
   2. STUDENT ATTENDANCE ACTIONS (EDIT & DELETE)
════════════════════════════════════════════════════════════ */

export async function editStudentAttendanceStatus(
  id: string,
  status: Database['public']['Enums']['attendance_status']
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Fetch current student and date for notification
    const { data: currentRecord } = await supabase
      .from('student_attendance')
      .select('student_id, date')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabase
      .from('student_attendance')
      .update({ status })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    // If updated to absent or late, dispatch alert to parent
    if ((status === 'absent' || status === 'late') && currentRecord) {
      dispatchAttendanceAlert({
        studentId: currentRecord.student_id,
        date: currentRecord.date,
        status: status as 'absent' | 'late',
      }).catch((e) => console.warn('Background student attendance alert error:', e))
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/classes')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update student attendance' }
  }
}

export async function deleteStudentAttendance(id: string) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
      .from('student_attendance')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/students')
    revalidatePath('/admin/classes')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete student attendance' }
  }
}

/* ════════════════════════════════════════════════════════════
   3. TEACHER PAYMENT ACTIONS
════════════════════════════════════════════════════════════ */

export async function recordTeacherPayment(
  teacherId: string,
  payload: {
    amount: number
    payment_date: string
    status: string
    remarks?: string
  }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('teacher_payments')
      .insert({
        teacher_id: teacherId,
        amount: payload.amount,
        payment_date: payload.payment_date,
        status: payload.status || 'paid',
        remarks: payload.remarks?.trim() || null,
        recorded_by: auth.profile.id,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    // Dispatch teacher payment advice email (with PDF) & push notification
    if (data?.id && (payload.status === 'paid' || !payload.status)) {
      try {
        await dispatchTeacherPaymentAlert({
          paymentId: data.id,
          teacherId,
          amount: payload.amount,
          paymentDate: payload.payment_date,
          remarks: payload.remarks,
        })
      } catch (alertErr) {
        console.warn('Teacher payment dispatch error:', alertErr)
      }
    }

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to record payment' }
  }
}

export async function editTeacherPayment(
  id: string,
  payload: {
    amount: number
    payment_date: string
    status: string
    remarks?: string
  }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { data: updatedPayment, error } = await supabase
      .from('teacher_payments')
      .update({
        amount: payload.amount,
        payment_date: payload.payment_date,
        status: payload.status,
        remarks: payload.remarks?.trim() || null,
      })
      .eq('id', id)
      .select('teacher_id')
      .maybeSingle()

    if (error) return { success: false, error: error.message }

    // Dispatch teacher payment advice email (with PDF) if status is paid
    if (payload.status === 'paid' && updatedPayment?.teacher_id) {
      try {
        await dispatchTeacherPaymentAlert({
          paymentId: id,
          teacherId: updatedPayment.teacher_id,
          amount: payload.amount,
          paymentDate: payload.payment_date,
          remarks: payload.remarks,
        })
      } catch (alertErr) {
        console.warn('Teacher payment edit dispatch error:', alertErr)
      }
    }

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to edit payment' }
  }
}

export async function deleteTeacherPayment(id: string) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
      .from('teacher_payments')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete payment' }
  }
}

/* ════════════════════════════════════════════════════════════
   4. STUDENT FEE ACTIONS
════════════════════════════════════════════════════════════ */

export async function getStudentFeesList(studentIdStr: string) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('student_fees')
      .select('*')
      .eq('student_id', studentIdStr)
      .order('due_date', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch student fees' }
  }
}

export async function recordStudentFee(
  studentIdStr: string,
  payload: {
    fee_name: string
    amount: number
    paid_amount: number
    due_date: string
    status?: string
  }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: null, error: auth.error }

    const supabase = await createClient()

    // Validate status according to database constraint: ('paid', 'due', 'upcoming')
    let validStatus = payload.status?.toLowerCase() || 'due'
    if (validStatus !== 'paid' && validStatus !== 'due' && validStatus !== 'upcoming') {
      validStatus = payload.paid_amount >= payload.amount ? 'paid' : 'due'
    }

    const { data, error } = await supabase
      .from('student_fees')
      .insert({
        student_id: studentIdStr,
        fee_name: payload.fee_name.trim(),
        amount: payload.amount,
        paid_amount: payload.paid_amount || 0,
        due_date: payload.due_date,
        status: validStatus,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    // If payment recorded, dispatch fee receipt email with PDF attachment
    if (data && (data.status === 'paid' || data.paid_amount > 0)) {
      try {
        await dispatchFeePaymentAlert({
          feeId: data.id,
          studentId: studentIdStr,
          feeName: data.fee_name,
          amount: data.amount,
          paidAmount: data.paid_amount,
          paymentDate: new Date().toISOString().split('T')[0],
        })
      } catch (alertErr) {
        console.warn('Fee payment dispatch error:', alertErr)
      }
    }

    revalidatePath('/admin/students')
    revalidatePath('/parent/fees')
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to record student fee' }
  }
}

export async function editStudentFee(
  id: string,
  payload: {
    fee_name: string
    amount: number
    paid_amount: number
    due_date: string
    status?: string
  }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Validate status according to database constraint: ('paid', 'due', 'upcoming')
    let validStatus = payload.status?.toLowerCase() || 'due'
    if (validStatus !== 'paid' && validStatus !== 'due' && validStatus !== 'upcoming') {
      validStatus = payload.paid_amount >= payload.amount ? 'paid' : 'due'
    }

    const { data, error } = await supabase
      .from('student_fees')
      .update({
        fee_name: payload.fee_name.trim(),
        amount: payload.amount,
        paid_amount: payload.paid_amount,
        due_date: payload.due_date,
        status: validStatus,
      })
      .eq('id', id)
      .select('student_id')
      .maybeSingle()

    if (error) return { success: false, error: error.message }

    // If paid, dispatch fee receipt PDF
    if (data && (validStatus === 'paid' || payload.paid_amount > 0)) {
      try {
        await dispatchFeePaymentAlert({
          feeId: id,
          studentId: data.student_id,
          feeName: payload.fee_name,
          amount: payload.amount,
          paidAmount: payload.paid_amount,
          paymentDate: new Date().toISOString().split('T')[0],
        })
      } catch (alertErr) {
        console.warn('Fee payment edit dispatch error:', alertErr)
      }
    }

    revalidatePath('/admin/students')
    revalidatePath('/parent/fees')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update student fee' }
  }
}

export async function deleteStudentFee(id: string) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
      .from('student_fees')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/students')
    revalidatePath('/parent/fees')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete student fee' }
  }
}

/* ════════════════════════════════════════════════════════════
   5. STUDENT RESULTS (EDIT / DELETE)
════════════════════════════════════════════════════════════ */

export async function editStudentResult(
  resultId: string,
  payload: {
    marks_obtained: number
    total_marks?: number
    subject?: string
  }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const updateData: { marks_obtained: number; total_marks?: number; subject?: string } = {
      marks_obtained: payload.marks_obtained,
    }
    if (typeof payload.total_marks === 'number') updateData.total_marks = payload.total_marks
    if (payload.subject) updateData.subject = payload.subject.trim()

    const { error } = await supabase
      .from('results')
      .update(updateData)
      .eq('id', resultId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/students')
    revalidatePath('/student/results')
    revalidatePath('/parent/progress')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to edit student result' }
  }
}

export async function deleteStudentResult(resultId: string) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', resultId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/students')
    revalidatePath('/student/results')
    revalidatePath('/parent/progress')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete student result' }
  }
}

/* ════════════════════════════════════════════════════════════
   6. PARENT - STUDENT LINKING ACTIONS
════════════════════════════════════════════════════════════ */

export async function linkStudentToParent(parentId: string, studentId: string) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
      .from('parent_students')
      .insert({
        parent_id: parentId,
        student_id: studentId,
      })

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/parents')
    revalidatePath('/parent')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to link student' }
  }
}

export async function unlinkStudentFromParent(parentId: string, studentId: string) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
      .from('parent_students')
      .delete()
      .eq('parent_id', parentId)
      .eq('student_id', studentId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/parents')
    revalidatePath('/parent')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to unlink student' }
  }
}

export async function getAvailableStudentsForLinking() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        profiles ( full_name, mobile ),
        classes ( class_name, section )
      `)
      .order('student_id', { ascending: true })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch students' }
  }
}

/* ════════════════════════════════════════════════════════════
   7. ALL CLASSES LIST (FOR DIRECT ASSIGNMENT)
════════════════════════════════════════════════════════════ */

export async function getAllClassesList() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('classes')
      .select('id, class_name, section')
      .order('class_name', { ascending: true })
      .order('section', { ascending: true })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch classes' }
  }
}

export async function updateTeacherClassAssignments(teacherId: string, classIds: string[]) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }

    // 1. Fetch existing assignments
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('teacher_classes')
      .select('class_id')
      .eq('teacher_id', teacherId)

    if (fetchError) return { success: false, error: fetchError.message }

    const existingClassIds = new Set((existing ?? []).map((r) => r.class_id))
    const desiredClassIds = new Set(classIds)

    // 2. Remove de-selected classes
    const toRemove = [...existingClassIds].filter((id) => !desiredClassIds.has(id))
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('teacher_classes')
        .delete()
        .eq('teacher_id', teacherId)
        .in('class_id', toRemove)

      if (deleteError) return { success: false, error: deleteError.message }
    }

    // 3. Insert newly selected classes
    const toAdd = [...desiredClassIds].filter((id) => !existingClassIds.has(id))
    if (toAdd.length > 0) {
      const inserts = toAdd.map((cid) => ({
        teacher_id: teacherId,
        class_id: cid,
        subject: 'General',
      }))

      const { error: insertError } = await supabaseAdmin
        .from('teacher_classes')
        .insert(inserts)

      if (insertError) return { success: false, error: insertError.message }
    }

    revalidatePath('/admin/teachers')
    revalidatePath('/teacher')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update teacher classes' }
  }
}
