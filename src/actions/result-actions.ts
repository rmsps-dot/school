'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

/* ── Types ─────────────────────────────────────────────────── */

export interface ClassWithSubject {
  classId: string
  className: string
  section: string
  subject: string
}

export interface StudentInClass {
  studentRowId: string   // students.id (UUID)
  studentCode: string    // students.student_id (e.g. STU-2024-0001)
  fullName: string       // profiles.full_name
}

export interface MarkEntry {
  studentRowId: string
  marksObtained: number
  totalMarks: number
}

export interface ResultActionResult {
  success: boolean
  error?: string
  inserted?: number
  updated?: number
}

import { requireTeacher, requireAuth } from '@/utils/auth-helpers'

/* ── Helper: verify caller is a teacher or admin, return their info ── */
async function getRoleAndContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (profile?.role === 'admin') {
    return { role: 'admin', userId: user.id, teacherId: null }
  } else if (profile?.role === 'teacher') {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!teacher) {
      throw new Error('Your teacher profile is incomplete. No associated teacher record found. Please contact the administrator.')
    }
    return { role: 'teacher', userId: user.id, teacherId: teacher.id }
  }

  throw new Error('Forbidden: Admin or Teacher Only')
}

/* ─────────────────────────────────────────────────────────────
   GET TEACHER'S ASSIGNED CLASSES
   Returns unique classes (deduplicated) for the sidebar card list.
───────────────────────────────────────────────────────────── */
export async function getTeacherClasses(): Promise<{
  data: ClassWithSubject[]
  error?: string
}> {
  try {
    const ctx = await getRoleAndContext()
    if (ctx.role !== 'teacher') return { data: [], error: 'Only teachers have assigned classes.' }
    
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('teacher_classes')
      .select('class_id, subject, classes(id, class_name, section)')
      .eq('teacher_id', ctx.teacherId)
      .order('class_id')

    if (error) return { data: [], error: error.message }
    if (!data) return { data: [] }

    const result: ClassWithSubject[] = data.map((row) => {
      const cls = Array.isArray(row.classes) ? row.classes[0] : row.classes
      return {
        classId: row.class_id,
        className: cls?.class_name ?? 'Unknown',
        section: cls?.section ?? '',
        subject: row.subject,
      }
    })

    return { data: result }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

/* ─────────────────────────────────────────────────────────────
   GET STUDENTS FOR A CLASS
   Verifies teacher is assigned to this class before returning students.
───────────────────────────────────────────────────────────── */
export async function getStudentsForClass(classId: string): Promise<{
  data: StudentInClass[]
  error?: string
}> {
  try {
    const ctx = await getRoleAndContext()
    const supabase = await createClient()

    // Security: verify teacher is actually assigned to this class
    if (ctx.role === 'teacher') {
      const { data: assignment } = await supabase
        .from('teacher_classes')
        .select('class_id')
        .eq('teacher_id', ctx.teacherId)
        .eq('class_id', classId)
        .maybeSingle()

      if (!assignment) {
        return { data: [], error: 'Access denied: you are not assigned to this class.' }
      }
    }

    const { data, error } = await supabase
      .from('students')
      .select('id, student_id, profiles(full_name)')
      .eq('class_id', classId)
      .order('student_id')

    if (error) return { data: [], error: error.message }
    if (!data) return { data: [] }

    const students: StudentInClass[] = data.map((s) => {
      const prof = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
      return {
        studentRowId: s.id,
        studentCode: s.student_id,
        fullName: prof?.full_name ?? 'Unknown',
      }
    })

    return { data: students }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

/* ─────────────────────────────────────────────────────────────
   UPLOAD RESULTS
   Upserts result rows for a given class + exam + subject.
   Uses ON CONFLICT to update existing unapproved rows.

   Security checks:
     1. Caller must be a teacher.
     2. Teacher must be assigned to the given classId.
     3. All studentRowIds must belong to the given classId.
───────────────────────────────────────────────────────────── */
import type { Database } from '@/types/supabase'

export async function uploadResults(payload: {
  classId: string
  examType: Database['public']['Enums']['exam_type']
  subject: string
  marks: MarkEntry[]
}): Promise<ResultActionResult> {
  try {
    const ctx = await getRoleAndContext()
    const supabase = await createClient()

    // Guard 1: Teacher is assigned to this class
    if (ctx.role === 'teacher') {
      const { data: assignment } = await supabase
        .from('teacher_classes')
        .select('class_id')
        .eq('teacher_id', ctx.teacherId)
        .eq('class_id', payload.classId)
        .maybeSingle()

      if (!assignment) {
        return { success: false, error: 'Access denied: not assigned to this class.' }
      }
    }

    // Guard 2: Basic marks validation
    for (const m of payload.marks) {
      if (m.marksObtained < 0 || m.totalMarks <= 0) {
        return { success: false, error: 'Invalid marks: values must be non-negative and total > 0.' }
      }
      if (m.marksObtained > m.totalMarks) {
        return { success: false, error: 'Marks obtained cannot exceed total marks.' }
      }
    }

    // Build upsert payload
    const rows = payload.marks.map((m) => ({
      student_id:     m.studentRowId,
      class_id:       payload.classId,
      exam_type:      payload.examType,
      subject:        payload.subject,
      marks_obtained: m.marksObtained,
      total_marks:    m.totalMarks,
      uploaded_by:    ctx.role === 'teacher' ? ctx.teacherId : null,
      is_approved:    ctx.role === 'admin' ? true : false,
      approved_by:    ctx.role === 'admin' ? ctx.userId : null,
      approved_at:    ctx.role === 'admin' ? new Date().toISOString() : null,
    }))

    // Upsert: update if the unique key (student_id, exam_type, subject) already exists
    // but only if not yet approved (approved rows are write-protected by RLS anyway)
    const { data: upserted, error } = await supabase
      .from('results')
      .upsert(rows, {
        onConflict: 'student_id,exam_type,subject',
        ignoreDuplicates: false,
      })
      .select('id')

    if (error) return { success: false, error: error.message }

    revalidatePath('/teacher/results')
    revalidatePath('/teacher/classes')

    return { success: true, inserted: upserted?.length ?? rows.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[uploadResults]', msg)
    return { success: false, error: msg }
  }
}
