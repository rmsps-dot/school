'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAdmin, requireTeacher } from '@/utils/auth-helpers'

export interface StudentFeeReceiptItem {
  id: string
  fee_name: string
  amount: number
  paid_amount: number
  due_date: string
  status: string
  created_at: string
  student_row_id?: string
  student_id: string
  student_name: string
  father_name?: string
  class_id?: string
  class_name: string
  section: string
  parent_email?: string
}

export interface TeacherPaymentReceiptItem {
  id: string
  teacher_id: string
  teacher_code: string
  teacher_name: string
  qualification: string
  amount: number
  payment_date: string
  remarks: string | null
  status: string
  created_at: string | null
}

/**
 * 1. Admin: Fetch all student fee records with student profile and class details.
 */
export async function getAllStudentFeeReceipts(): Promise<{
  data: StudentFeeReceiptItem[]
  error: string | null
}> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('student_fees')
      .select(`
        id,
        fee_name,
        amount,
        paid_amount,
        due_date,
        status,
        created_at,
        student_id,
        students (
          id,
          student_id,
          father_name,
          class_id,
          profiles (
            full_name,
            email,
            phone_number
          ),
          classes (
            id,
            class_name,
            section
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getAllStudentFeeReceipts] query error:', error)
      return { data: [], error: error.message }
    }

    const items: StudentFeeReceiptItem[] = (data || []).map((row) => {
      const studentRel = Array.isArray(row.students) ? row.students[0] : row.students
      const profileRel = Array.isArray(studentRel?.profiles) ? studentRel.profiles[0] : studentRel?.profiles
      const classRel = Array.isArray(studentRel?.classes) ? studentRel.classes[0] : studentRel?.classes

      return {
        id: row.id,
        fee_name: row.fee_name,
        amount: Number(row.amount) || 0,
        paid_amount: Number(row.paid_amount) || 0,
        due_date: row.due_date,
        status: row.status,
        created_at: row.created_at,
        student_row_id: studentRel?.id,
        student_id: studentRel?.student_id || row.student_id,
        student_name: profileRel?.full_name || 'Student',
        father_name: studentRel?.father_name || undefined,
        class_id: studentRel?.class_id || undefined,
        class_name: classRel?.class_name || 'General',
        section: classRel?.section || '',
        parent_email: profileRel?.email || undefined,
      }
    })

    return { data: items, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch student receipts'
    return { data: [], error: msg }
  }
}

/**
 * 2. Admin: Fetch all teacher payments with teacher and profile details.
 */
export async function getAllTeacherPayments(): Promise<{
  data: TeacherPaymentReceiptItem[]
  error: string | null
}> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('teacher_payments')
      .select(`
        id,
        teacher_id,
        amount,
        payment_date,
        remarks,
        status,
        created_at,
        teachers (
          id,
          teacher_id,
          qualification,
          profiles (
            full_name,
            email,
            phone_number
          )
        )
      `)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('[getAllTeacherPayments] query error:', error)
      return { data: [], error: error.message }
    }

    const items: TeacherPaymentReceiptItem[] = (data || []).map((row) => {
      const teacherRel = Array.isArray(row.teachers) ? row.teachers[0] : row.teachers
      const profileRel = Array.isArray(teacherRel?.profiles) ? teacherRel.profiles[0] : teacherRel?.profiles

      return {
        id: row.id,
        teacher_id: row.teacher_id,
        teacher_code: teacherRel?.teacher_id || 'N/A',
        teacher_name: profileRel?.full_name || 'Faculty Member',
        qualification: teacherRel?.qualification || 'Faculty Member',
        amount: Number(row.amount) || 0,
        payment_date: row.payment_date,
        remarks: row.remarks,
        status: row.status,
        created_at: row.created_at,
      }
    })

    return { data: items, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch teacher payments'
    return { data: [], error: msg }
  }
}

/**
 * 3. Teacher Portal: Fetch salary payments for the currently logged-in teacher.
 */
export async function getTeacherPaymentsForCurrentTeacher(): Promise<{
  data: TeacherPaymentReceiptItem[]
  teacherInfo?: {
    teacherId: string
    teacherCode: string
    teacherName: string
    qualification: string
  }
  error: string | null
}> {
  try {
    const auth = await requireTeacher()
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()

    // 1. Get teacher row for current profile
    const { data: teacher, error: teacherErr } = await supabase
      .from('teachers')
      .select(`
        id,
        teacher_id,
        qualification,
        profiles (
          full_name,
          email,
          phone_number
        )
      `)
      .eq('profile_id', auth.profile.id)
      .single()

    if (teacherErr || !teacher) {
      return { data: [], error: teacherErr?.message || 'Teacher record not found' }
    }

    const profileRel = Array.isArray(teacher.profiles) ? teacher.profiles[0] : teacher.profiles
    const teacherName = profileRel?.full_name || 'Faculty Member'
    const teacherCode = teacher.teacher_id
    const qualification = teacher.qualification || 'Faculty Member'

    // 2. Query payments for this teacher
    const { data: payments, error: payErr } = await supabase
      .from('teacher_payments')
      .select('*')
      .eq('teacher_id', teacher.id)
      .order('payment_date', { ascending: false })

    if (payErr) {
      return { data: [], error: payErr.message }
    }

    const items: TeacherPaymentReceiptItem[] = (payments || []).map((p) => ({
      id: p.id,
      teacher_id: teacher.id,
      teacher_code: teacherCode,
      teacher_name: teacherName,
      qualification,
      amount: Number(p.amount) || 0,
      payment_date: p.payment_date,
      remarks: p.remarks,
      status: p.status,
      created_at: p.created_at,
    }))

    return {
      data: items,
      teacherInfo: {
        teacherId: teacher.id,
        teacherCode,
        teacherName,
        qualification,
      },
      error: null,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch teacher payment history'
    return { data: [], error: msg }
  }
}
