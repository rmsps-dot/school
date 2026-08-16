'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { withErrorDetector } from '@/utils/ErrorDetector'
import { requireTeacher } from '@/utils/auth-helpers'

/* ── Helper: verify caller is a teacher and return their teacher row id ── */
async function requireTeacherRow() {
  const auth = await requireTeacher()
  if (!auth.ok) throw new Error(auth.error)

  const supabase = await createClient()
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('profile_id', auth.profile.id)
    .maybeSingle()

  if (!teacher) throw new Error('Teacher record not found. Contact admin.')
  return { supabase, teacher }
}

export const getTeacherResults = withErrorDetector('getTeacherResults', async () => {
  const { supabase, teacher } = await requireTeacherRow()

  const { data: teacherClasses } = await supabase
    .from('teacher_classes')
    .select('class_id')
    .eq('teacher_id', teacher.id)

  const classIds = teacherClasses?.map(tc => tc.class_id) || []

  let query = supabase
    .from('results')
    .select(`
      *,
      students (id, student_id, father_name, mother_name, profiles (full_name, dob, address)),
      classes (id, class_name, section)
    `)
    .order('created_at', { ascending: false })

  if (classIds.length > 0) {
    query = query.or(`uploaded_by.eq.${teacher.id},class_id.in.(${classIds.join(',')})`)
  } else {
    query = query.eq('uploaded_by', teacher.id)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  return { data, error: null }
})

export const updateTeacherResult = withErrorDetector('updateTeacherResult', async (resultId: string, formData: FormData) => {
  const { supabase, teacher } = await requireTeacherRow()

  const marksObtained = parseFloat(formData.get('marksObtained') as string)
  const totalMarks = parseFloat(formData.get('totalMarks') as string)

  if (isNaN(marksObtained) || isNaN(totalMarks) || marksObtained > totalMarks || totalMarks <= 0) {
    return { error: 'Invalid marks entered. Marks obtained must be <= Total Marks.' }
  }

  // Verify this result belongs to this teacher
  const { data: resultCheck } = await supabase
    .from('results')
    .select('is_approved, uploaded_by')
    .eq('id', resultId)
    .single()

  if (!resultCheck) return { error: 'Result not found.' }
  if (resultCheck.uploaded_by !== teacher.id) {
    return { error: 'You are not authorized to edit this result.' }
  }

  if (resultCheck.is_approved) {
    // Submit an edit request instead of modifying directly
    const { error } = await supabase
      .from('results')
      .update({
        edit_request: { marks_obtained: marksObtained, total_marks: totalMarks, requested_at: new Date().toISOString() }
      })
      .eq('id', resultId)

    if (error) return { error: error.message }
    revalidatePath('/teacher/manage-results')
    return { success: true, pending: true }
  } else {
    // Direct modification if not yet approved
    const { error } = await supabase
      .from('results')
      .update({ marks_obtained: marksObtained, total_marks: totalMarks })
      .eq('id', resultId)

    if (error) return { error: error.message }
    revalidatePath('/teacher/manage-results')
    return { success: true }
  }
})

export const deleteTeacherResult = withErrorDetector('deleteTeacherResult', async (resultIds: string[]) => {
  const { supabase, teacher } = await requireTeacherRow()

  const { data: resultsCheck } = await supabase
    .from('results')
    .select('id, is_approved, uploaded_by')
    .in('id', resultIds)

  if (!resultsCheck || resultsCheck.length === 0) {
    return { error: 'Results not found.' }
  }

  // Hard ownership check — teacher.id is now guaranteed non-null
  const notAuthorized = resultsCheck.some(r => r.uploaded_by !== teacher.id)
  if (notAuthorized) {
    return { error: 'You are not authorized to delete some of these results.' }
  }

  const hasApproved = resultsCheck.some(r => r.is_approved)

  if (hasApproved) {
    // Submit a delete request for approved results
    const { error } = await supabase
      .from('results')
      .update({ delete_request: true })
      .in('id', resultIds)

    if (error) return { error: error.message }
    revalidatePath('/teacher/manage-results')
    return { success: true, pending: true }
  } else {
    // Direct delete for unapproved results
    const { error } = await supabase.from('results').delete().in('id', resultIds)
    if (error) return { error: error.message }
    revalidatePath('/teacher/manage-results')
    return { success: true }
  }
})
