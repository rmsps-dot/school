'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireTeacherForClass } from '@/utils/auth-helpers'

export async function getStudentAttendance(classId: string, date: string) {
  if (classId) {
    const auth = await requireTeacherForClass(classId, { allowAdmin: true })
    if (!auth.ok) return { data: null, error: auth.error }
  } else {
    // Empty string will force admin bypass check, because classId won't match a teacher's class
    const auth = await requireTeacherForClass('', { allowAdmin: true })
    if (!auth.ok) return { data: null, error: auth.error }
  }
  const supabase = await createClient()
  let query = supabase
    .from('student_attendance')
    .select('*')
    .eq('date', date)

  if (classId) {
    query = query.eq('class_id', classId)
  }

  const { data, error } = await query
    
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function markStudentAttendance(records: any[]) {
  // records array should have { student_id, class_id, date, status }
  if (!records || records.length === 0) return { success: true }
  const classId = records[0].class_id

  const auth = await requireTeacherForClass(classId, { allowAdmin: true })
  if (!auth.ok) return { error: auth.error }
  const user = { id: auth.profile.id }

  const supabase = await createClient()

  const payload = records.map(r => ({
    ...r,
    marked_by: user.id
  }))

  const { error } = await supabase
    .from('student_attendance')
    .upsert(payload, { onConflict: 'student_id,date' })

  if (error) return { error: error.message }
  return { success: true }
}
