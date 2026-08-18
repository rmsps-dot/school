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
import type { Database } from '@/types/supabase'

export async function markStudentAttendance(records: Database['public']['Tables']['student_attendance']['Insert'][]) {
  // records array should have { student_id, class_id, date, status }
  if (!records || records.length === 0) return { success: true }

  // Verify all distinct class IDs present in the batch
  const uniqueClassIds = Array.from(new Set(records.map(r => r.class_id).filter((cid): cid is string => Boolean(cid))))
  if (uniqueClassIds.length === 0) return { error: 'Class identifier is required.' }

  for (const cid of uniqueClassIds) {
    const auth = await requireTeacherForClass(cid, { allowAdmin: true })
    if (!auth.ok) return { error: auth.error }
  }

  const baseAuth = await requireTeacherForClass(uniqueClassIds[0], { allowAdmin: true })
  if (!baseAuth.ok) return { error: baseAuth.error }
  const user = { id: baseAuth.profile.id }

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
