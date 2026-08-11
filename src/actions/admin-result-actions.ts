'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/utils/auth-helpers'
import { calcGrade } from '@/utils/helpers'


import type { Database } from '@/types/supabase'

export interface PendingResultRow {
  id: string
  student_id: string          // students.id (UUID)
  class_id: string
  exam_type: Database['public']['Enums']['exam_type']
  subject: string
  marks_obtained: number
  total_marks: number
  uploaded_by: string | null  // teachers.id
  created_at: string
}

export interface StudentMarksheet {
  // Student info
  studentRowId: string         // students.id
  studentCode: string          // students.student_id (STU-YYYY-XXXX)
  studentName: string
  fatherName: string | null
  motherName: string | null
  dob: string | null
  address: string | null

  // Class info
  classId: string
  className: string
  section: string

  // Exam info
  examType: Database['public']['Enums']['exam_type']

  // Teacher who uploaded
  teacherName: string | null

  // Marks
  subjects: {
    id: string
    subject: string
    marksObtained: number
    totalMarks: number
    passingMarks: number      // calculated as 33% of total
  }[]

  // Computed
  totalObtained: number
  grandTotal: number
  percentage: number
  grade: string
}

/* ── Grade calculator ─────────────────────────────────────── */


/* ─────────────────────────────────────────────────────────────
   FETCH ALL PENDING RESULTS — grouped into student marksheets
   Each "marksheet" = one student × one exam type
───────────────────────────────────────────────────────────── */
export async function fetchPendingResults(): Promise<{
  data: StudentMarksheet[]
  error?: string
}> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()
    // Fetch all unapproved results with all needed joins
    const { data, error } = await supabase
      .from('results')
      .select(`
        id,
        exam_type,
        subject,
        marks_obtained,
        total_marks,
        uploaded_by,
        created_at,
        student_id,
        class_id,
        students!inner(
          id,
          student_id,
          father_name,
          mother_name,
          admission_date,
          profiles!inner(full_name, dob, address)
        ),
        classes!inner(class_name, section)
      `)
      .eq('is_approved', false)
      .order('class_id')
      .order('exam_type')
      .order('student_id')

    if (error) return { data: [], error: error.message }
    if (!data || data.length === 0) return { data: [] }

    // Batch-fetch teacher names in ONE query instead of one per marksheet
    const teacherIds = [...new Set(data.map(r => r.uploaded_by).filter(Boolean) as string[])]
    const teacherNameMap = new Map<string, string>()
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from('teachers')
        .select('id, profiles(full_name)')
        .in('id', teacherIds)
      for (const t of teachers ?? []) {
        const name = (t.profiles as unknown as { full_name: string } | null)?.full_name
        if (name) teacherNameMap.set(t.id, name)
      }
    }

    // Build a map: `${student_id}__${exam_type}` → StudentMarksheet
    const marksheetMap = new Map<string, StudentMarksheet>()

    for (const row of data) {
      const student = Array.isArray(row.students) ? row.students[0] : row.students
      const cls = Array.isArray(row.classes) ? row.classes[0] : row.classes
      const prof = Array.isArray(student?.profiles) ? student.profiles[0] : student?.profiles
      const key = `${row.student_id}__${row.exam_type}`

      if (!marksheetMap.has(key)) {
        const teacherName = row.uploaded_by ? (teacherNameMap.get(row.uploaded_by) ?? null) : null
        marksheetMap.set(key, {
          studentRowId:  row.student_id,
          studentCode:   student?.student_id ?? 'Unknown',
          studentName:   prof?.full_name ?? 'Unknown',
          fatherName:    student?.father_name ?? null,
          motherName:    student?.mother_name ?? null,
          dob:           prof?.dob ?? null,
          address:       prof?.address ?? null,
          classId:       row.class_id,
          className:     cls?.class_name ?? '—',
          section:       cls?.section ?? '—',
          examType:      row.exam_type,
          teacherName,
          subjects:      [],
          totalObtained: 0,
          grandTotal:    0,
          percentage:    0,
          grade:         '',
        })
      }

      const sheet = marksheetMap.get(key)!
      const passingMarks = Math.ceil(row.total_marks * 0.33)
      sheet.subjects.push({
        id:            row.id,
        subject:       row.subject,
        marksObtained: Number(row.marks_obtained),
        totalMarks:    Number(row.total_marks),
        passingMarks,
      })
    }

    // Compute totals + grade for each marksheet
    const marksheets = Array.from(marksheetMap.values()).map((sheet) => {
      const totalObtained = sheet.subjects.reduce((s, r) => s + r.marksObtained, 0)
      const grandTotal    = sheet.subjects.reduce((s, r) => s + r.totalMarks,    0)
      const percentage    = grandTotal > 0 ? (totalObtained / grandTotal) * 100 : 0
      return {
        ...sheet,
        totalObtained,
        grandTotal,
        percentage,
        grade: calcGrade(percentage),
      }
    })

    return { data: marksheets }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { data: [], error: msg }
  }
}

/* ─────────────────────────────────────────────────────────────
   APPROVE STUDENT RESULTS
   Approves ALL result rows for a given student + exam_type.
   Sets is_approved = true, approved_by = admin's profile id,
   approved_at = now().
───────────────────────────────────────────────────────────── */
export async function approveStudentResults(
  studentRowId: string,
  examType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }
    const adminUser = { id: auth.profile.id }

    const supabase = await createClient()
    const { error } = await supabase
      .from('results')
      .update({
        is_approved:  true,
        approved_by:  adminUser.id,
        approved_at:  new Date().toISOString(),
      })
      .eq('student_id',  studentRowId)
      .eq('exam_type',   examType)
      .eq('is_approved', false)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/results')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}

/* ─────────────────────────────────────────────────────────────
   FETCH ALL APPROVED RESULTS — for Manage Results / PDF generation
───────────────────────────────────────────────────────────── */
export async function fetchApprovedResults(): Promise<{
  data: StudentMarksheet[]
  error?: string
}> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('results')
      .select(`
        id,
        exam_type,
        subject,
        marks_obtained,
        total_marks,
        uploaded_by,
        approved_at,
        created_at,
        student_id,
        class_id,
        students!inner(
          id,
          student_id,
          father_name,
          mother_name,
          admission_date,
          profiles!inner(full_name, dob, address)
        ),
        classes!inner(class_name, section)
      `)
      .eq('is_approved', true)
      .order('approved_at', { ascending: false })
      .order('student_id')

    if (error) return { data: [], error: error.message }
    if (!data || data.length === 0) return { data: [] }

    // Batch-fetch teacher names in ONE query instead of one per marksheet
    const teacherIds = [...new Set(data.map(r => r.uploaded_by).filter(Boolean) as string[])]
    const teacherNameMap = new Map<string, string>()
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from('teachers')
        .select('id, profiles(full_name)')
        .in('id', teacherIds)
      for (const t of teachers ?? []) {
        const prof = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
        const name = prof?.full_name
        if (name) teacherNameMap.set(t.id, name)
      }
    }

    const marksheetMap = new Map<string, StudentMarksheet & { approvedAt?: string }>()

    for (const row of data) {
      const student = Array.isArray(row.students) ? row.students[0] : row.students
      const cls = Array.isArray(row.classes) ? row.classes[0] : row.classes
      const prof = Array.isArray(student?.profiles) ? student.profiles[0] : student?.profiles
      const key = `${row.student_id}__${row.exam_type}`

      if (!marksheetMap.has(key)) {
        const teacherName = row.uploaded_by ? (teacherNameMap.get(row.uploaded_by) ?? null) : null
        marksheetMap.set(key, {
          studentRowId:  row.student_id,
          studentCode:   student?.student_id ?? 'Unknown',
          studentName:   prof?.full_name ?? 'Unknown',
          fatherName:    student?.father_name ?? null,
          motherName:    student?.mother_name ?? null,
          dob:           prof?.dob ?? null,
          address:       prof?.address ?? null,
          classId:       row.class_id,
          className:     cls?.class_name ?? '—',
          section:       cls?.section ?? '—',
          examType:      row.exam_type,
          teacherName,
          subjects:      [],
          totalObtained: 0,
          grandTotal:    0,
          percentage:    0,
          grade:         '',
          approvedAt:    row.approved_at || undefined,
        })
      }

      const sheet = marksheetMap.get(key)!
      const passingMarks = Math.ceil(row.total_marks * 0.33)
      sheet.subjects.push({
        id:            row.id,
        subject:       row.subject,
        marksObtained: Number(row.marks_obtained),
        totalMarks:    Number(row.total_marks),
        passingMarks,
      })
    }

    const marksheets = Array.from(marksheetMap.values()).map((sheet) => {
      const totalObtained = sheet.subjects.reduce((s, r) => s + r.marksObtained, 0)
      const grandTotal    = sheet.subjects.reduce((s, r) => s + r.totalMarks, 0)
      const percentage    = grandTotal > 0 ? (totalObtained / grandTotal) * 100 : 0
      return { ...sheet, totalObtained, grandTotal, percentage, grade: calcGrade(percentage) }
    })

    return { data: marksheets }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { data: [], error: msg }
  }
}

export async function fetchModificationRequests() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }
    const commonSelect = `
      id, exam_type, subject, marks_obtained, total_marks,
      edit_request, delete_request,
      students!inner(student_id, profiles(full_name)),
      classes!inner(class_name, section)
    `

    const supabase = await createClient()

    // Fetch edit requests
    const { data: editData, error: editError } = await supabase
      .from('results')
      .select(commonSelect)
      .not('edit_request', 'is', null)
      .eq('is_approved', true)

    if (editError) return { data: [], error: editError.message }

    // Fetch delete requests
    const { data: deleteData, error: deleteError } = await supabase
      .from('results')
      .select(commonSelect)
      .eq('delete_request', true)
      .eq('is_approved', true)

    if (deleteError) return { data: [], error: deleteError.message }

    // Merge and deduplicate by ID
    const merged = [...(editData || []), ...(deleteData || [])]
    const uniqueMap = new Map(merged.map(item => [item.id, item]))
    const data = Array.from(uniqueMap.values())

    return { data }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function approveModificationRequest(resultIds: string[], actionType: 'edit' | 'delete') {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }
    const supabase = await createClient()
    
    if (actionType === 'delete') {
      const { error } = await supabase.from('results').delete().in('id', resultIds)
      if (error) throw new Error(error.message)
    } else {
      // For edits, we need to apply each individually because each has a unique edit_request JSON
      for (const id of resultIds) {
        const { data } = await supabase.from('results').select('edit_request').eq('id', id).single()
        if (!data?.edit_request) continue // Skip if no edit request found
        
        const req = data.edit_request as { marks_obtained: number, total_marks: number }
        const { error } = await supabase.from('results').update({
          marks_obtained: req.marks_obtained,
          total_marks: req.total_marks,
          edit_request: null
        }).eq('id', id)
        
        if (error) throw new Error(error.message)
      }
    }
    
    revalidatePath('/admin/results')
    revalidatePath('/admin/classes')
    revalidatePath('/teacher/manage-results')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function rejectModificationRequest(resultIds: string[]) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }
    const supabase = await createClient()
    
    const { error } = await supabase.from('results').update({
      edit_request: null,
      delete_request: false
    }).in('id', resultIds)
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/admin/results')
    revalidatePath('/admin/classes')
    revalidatePath('/teacher/manage-results')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
