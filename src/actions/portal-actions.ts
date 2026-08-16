'use server'

import { createClient } from '@/utils/supabase/server'
import { requireStudent as requireAuthStudent, requireParent as requireAuthParent } from '@/utils/auth-helpers'

/* ════════════════════════════════════════════════════════════
   SHARED TYPES
════════════════════════════════════════════════════════════ */

import type { Database } from '@/types/supabase'

export interface ApprovedResult {
  id: string
  exam_type: Database['public']['Enums']['exam_type']
  subject: string
  marks_obtained: number
  total_marks: number
  approved_at: string | null
  class_name: string
  section: string
}

export interface AttendanceRecord {
  id: string
  date: string
  status: Database['public']['Enums']['attendance_status']
  remarks: string | null
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  half_day: number
  percentage: number
  records: AttendanceRecord[]
}

export interface StudentProfile {
  studentRowId: string
  studentCode: string
  fullName: string
  profilePhotoUrl: string | null
  fatherName: string | null
  motherName: string | null
  dob: string | null
  address: string | null
  mobile: string | null
  className: string
  section: string
  admissionDate: string | null
}

export interface ChildInfo {
  studentRowId: string
  studentCode: string
  fullName: string
  profilePhotoUrl: string | null
  fatherName: string | null
  motherName: string | null
  dob: string | null
  address: string | null
  className: string
  section: string
  relation: string
}

/* ════════════════════════════════════════════════════════════
   STUDENT HELPERS — verify caller is a student, return IDs
════════════════════════════════════════════════════════════ */

async function requireStudentData() {
  const auth = await requireAuthStudent()
  if (!auth.ok) throw new Error(auth.error)

  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, student_id, father_name, mother_name, admission_date, class_id, classes(class_name, section)')
    .eq('profile_id', auth.profile.id)
    .single()
  if (!student) throw new Error('Student record not found. Contact admin.')

  const cls = Array.isArray(student.classes) ? student.classes[0] : student.classes

  return {
    user: auth.profile,
    profile: auth.profile,
    student,
    cls,
    studentRowId: student.id,
  }
}

/* ════════════════════════════════════════════════════════════
   STUDENT PORTAL ACTIONS
════════════════════════════════════════════════════════════ */

/* ── Get student profile ── */
export async function getStudentProfile(): Promise<{ data: StudentProfile | null; error?: string }> {
  try {
    const { profile, student, cls } = await requireStudentData()
    return {
      data: {
        studentRowId:  student.id,
        studentCode:   student.student_id,
        fullName:      profile.full_name ?? 'Student',
        profilePhotoUrl: profile.profile_photo_url ?? null,
        fatherName:    student.father_name,
        motherName:    student.mother_name,
        dob:           profile.dob || null,
        address:       profile.address || null,
        mobile:        profile.mobile || null,
        className:     cls?.class_name ?? '—',
        section:       cls?.section ?? '—',
        admissionDate: student.admission_date,
      },
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/* ── Get student's approved results ── */
export async function getStudentResults(): Promise<{ data: ApprovedResult[]; error?: string }> {
  try {
    const { studentRowId } = await requireStudentData()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('results')
      .select('id, exam_type, subject, marks_obtained, total_marks, approved_at, classes(class_name, section)')
      .eq('student_id', studentRowId)
      .eq('is_approved', true)
      .order('exam_type')
      .order('subject')

    if (error) return { data: [], error: error.message }

    const results: ApprovedResult[] = (data ?? []).map((r) => {
      const cls = Array.isArray(r.classes) ? r.classes[0] : r.classes
      return {
        id:              r.id,
        exam_type:       r.exam_type,
        subject:         r.subject,
        marks_obtained:  Number(r.marks_obtained),
        total_marks:     Number(r.total_marks),
        approved_at:     r.approved_at,
        class_name:      cls?.class_name ?? '—',
        section:         cls?.section ?? '—',
      }
    })

    return { data: results }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/* ── Get student's attendance ── */
export async function getStudentAttendance(): Promise<{ data: AttendanceSummary; error?: string }> {
  const empty: AttendanceSummary = { total: 0, present: 0, absent: 0, late: 0, half_day: 0, percentage: 0, records: [] }
  try {
    const { studentRowId } = await requireStudentData()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('student_attendance')
      .select('id, date, status, remarks')
      .eq('student_id', studentRowId)
      .order('date', { ascending: false })

    if (error) return { data: empty, error: error.message }

    const records: AttendanceRecord[] = (data ?? []).map((r) => ({
      id:      r.id,
      date:    r.date,
      status:  r.status,
      remarks: r.remarks,
    }))

    const total    = records.length
    const present  = records.filter((r) => r.status === 'present').length
    const absent   = records.filter((r) => r.status === 'absent').length
    const late     = records.filter((r) => r.status === 'late').length
    const half_day = records.filter((r) => r.status === 'half_day').length
    const pctDays  = present + late + half_day * 0.5
    const percentage = total > 0 ? Math.round((pctDays / total) * 100) : 0

    return { data: { total, present, absent, late, half_day, percentage, records } }
  } catch (err) {
    return { data: empty, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/* ════════════════════════════════════════════════════════════
   PARENT HELPERS
════════════════════════════════════════════════════════════ */

async function requireParentData() {
  const auth = await requireAuthParent()
  if (!auth.ok) throw new Error(auth.error)

  const supabase = await createClient()

  const { data: parent } = await supabase
    .from('parents')
    .select('id')
    .eq('profile_id', auth.profile.id)
    .single()
  if (!parent) throw new Error('Parent record not found. Contact admin.')

  return { user: auth.profile, profile: auth.profile, parentRowId: parent.id }
}

/* ════════════════════════════════════════════════════════════
   PARENT PORTAL ACTIONS
════════════════════════════════════════════════════════════ */

/* ── Get all children linked to this parent ── */
export async function getParentChildren(): Promise<{ data: ChildInfo[]; error?: string }> {
  try {
    const { parentRowId } = await requireParentData()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('parent_students')
      .select('relation, students!inner(id, student_id, class_id, father_name, mother_name, classes(class_name, section), profiles!inner(full_name, dob, address, profile_photo_url))')
      .eq('parent_id', parentRowId)

    if (error) return { data: [], error: error.message }

    const children: ChildInfo[] = (data ?? []).map((row) => {
      const student = Array.isArray(row.students) ? row.students[0] : row.students
      const cls = Array.isArray(student?.classes) ? student.classes[0] : student?.classes
      const prof = Array.isArray(student?.profiles) ? student.profiles[0] : student?.profiles
      return {
        studentRowId: student.id,
        studentCode:  student.student_id,
        fullName:     prof?.full_name ?? 'Unknown',
        profilePhotoUrl: prof?.profile_photo_url ?? null,
        fatherName:   student?.father_name ?? null,
        motherName:   student?.mother_name ?? null,
        dob:          prof?.dob ?? null,
        address:      prof?.address ?? null,
        className:    cls?.class_name ?? '—',
        section:      cls?.section ?? '—',
        relation:     row.relation,
      }
    })

    return { data: children }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/* ── Get a specific child's approved results (parent-scoped) ── */
export async function getChildResults(studentRowId: string): Promise<{ data: ApprovedResult[]; error?: string }> {
  try {
    const { parentRowId } = await requireParentData()
    const supabase = await createClient()

    // Verify this child is actually linked to this parent
    const { data: link } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', parentRowId)
      .eq('student_id', studentRowId)
      .maybeSingle()

    if (!link) return { data: [], error: 'Access denied: this student is not linked to your account.' }

    const { data, error } = await supabase
      .from('results')
      .select('id, exam_type, subject, marks_obtained, total_marks, approved_at, classes(class_name, section)')
      .eq('student_id', studentRowId)
      .eq('is_approved', true)
      .order('exam_type')
      .order('subject')

    if (error) return { data: [], error: error.message }

    const results: ApprovedResult[] = (data ?? []).map((r) => {
      const cls = Array.isArray(r.classes) ? r.classes[0] : r.classes
      return {
        id:             r.id,
        exam_type:      r.exam_type,
        subject:        r.subject,
        marks_obtained: Number(r.marks_obtained),
        total_marks:    Number(r.total_marks),
        approved_at:    r.approved_at,
        class_name:     cls?.class_name ?? '—',
        section:        cls?.section ?? '—',
      }
    })

    return { data: results }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/* ── Get a specific child's attendance (parent-scoped) ── */
export async function getChildAttendance(studentRowId: string): Promise<{ data: AttendanceSummary; error?: string }> {
  const empty: AttendanceSummary = { total: 0, present: 0, absent: 0, late: 0, half_day: 0, percentage: 0, records: [] }
  try {
    const { parentRowId } = await requireParentData()
    const supabase = await createClient()

    // Verify link
    const { data: link } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', parentRowId)
      .eq('student_id', studentRowId)
      .maybeSingle()

    if (!link) return { data: empty, error: 'Access denied.' }

    const { data, error } = await supabase
      .from('student_attendance')
      .select('id, date, status, remarks')
      .eq('student_id', studentRowId)
      .order('date', { ascending: false })

    if (error) return { data: empty, error: error.message }

    const records: AttendanceRecord[] = (data ?? []).map((r) => ({
      id: r.id, date: r.date, status: r.status, remarks: r.remarks,
    }))

    const total    = records.length
    const present  = records.filter((r) => r.status === 'present').length
    const absent   = records.filter((r) => r.status === 'absent').length
    const late     = records.filter((r) => r.status === 'late').length
    const half_day = records.filter((r) => r.status === 'half_day').length
    const pctDays  = present + late + half_day * 0.5
    const percentage = total > 0 ? Math.round((pctDays / total) * 100) : 0

    return { data: { total, present, absent, late, half_day, percentage, records } }
  } catch (err) {
    return { data: empty, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
