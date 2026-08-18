'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireAdmin, requireTeacherForClass } from '@/utils/auth-helpers'

import type { Database } from '@/types/supabase'

export type SchoolClass = Database['public']['Tables']['classes']['Row']

export async function getClasses(): Promise<{ data: SchoolClass[] | null; error: string | null }> {
  const auth = await requireAuth()
  if (!auth.ok) return { data: null, error: auth.error }
  if (auth.profile.role !== 'admin' && auth.profile.role !== 'teacher') return { data: null, error: 'Forbidden' }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('class_name', { ascending: true })
    .order('section', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createClass(formData: FormData) {
  const className = formData.get('className') as string
  const section = formData.get('section') as string

  if (!className || !section) return { error: 'Class Name and Section are required.' }

  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const { error } = await supabase.from('classes').insert({
    class_name: className.trim(),
    section: section.trim().toUpperCase(),
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This Class and Section combination already exists.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/classes')
  return { success: true }
}

export async function deleteClass(classId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  // Check if students or teachers are tied to this class
  // Since we use ON DELETE RESTRICT for students, it will fail automatically at the DB level,
  // but we can catch it.
  const { error } = await supabase.from('classes').delete().eq('id', classId)

  if (error) {
    if (error.code === '23503') {
      return { error: 'Cannot delete this class because it has assigned students or teachers.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/classes')
  return { success: true }
}

export interface StudentViewRecord {
  id: string
  student_id: string
  class_id: string
  father_name: string | null
  mother_name: string | null
  profiles: {
    id: string
    full_name: string | null
    profile_photo_url: string | null
    mobile: string | null
    dob: string | null
    address: string | null
  } | null
  classes: {
    class_name: string
    section: string
  } | null
}

export async function getStudentsByClass(classId?: string): Promise<{ data: StudentViewRecord[] | null, error: string | null }> {
  const auth = await requireAuth()
  if (!auth.ok) return { data: null, error: auth.error }
  if (auth.profile.role !== 'admin' && auth.profile.role !== 'teacher') {
    return { data: null, error: 'Forbidden: Admin or Teacher only' }
  }

  const supabase = await createClient()

  let query = supabase
    .from('students')
    .select(`
      id,
      student_id,
      father_name,
      mother_name,
      class_id,
      classes (class_name, section),
      profiles (
        id,
        full_name,
        profile_photo_url,
        mobile,
        dob,
        address
      )
    `)
    .order('created_at', { ascending: false })

  if (classId) {
    query = query.eq('class_id', classId)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  
  const mappedData: StudentViewRecord[] = (data || []).map(s => {
    const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    const c = Array.isArray(s.classes) ? s.classes[0] : s.classes;
    return {
      id: s.id,
      student_id: s.student_id,
      class_id: s.class_id,
      father_name: s.father_name,
      mother_name: s.mother_name,
      profiles: p ? {
        id: p.id,
        full_name: p.full_name,
        profile_photo_url: p.profile_photo_url,
        mobile: p.mobile,
        dob: p.dob,
        address: p.address
      } : null,
      classes: c ? {
        class_name: c.class_name,
        section: c.section
      } : null
    }
  });

  return { data: mappedData, error: null }
}

export async function getAdminClassAttendance(classId: string | undefined, date: string) {
  const auth = classId ? await requireTeacherForClass(classId, { allowAdmin: true }) : await requireAdmin();
  if (!auth.ok) return { data: null, error: auth.error };
  const supabase = await createClient()

  // Get students
  const { data: students, error: studErr } = await getStudentsByClass(classId)
  
  if (studErr || !students) return { data: null, error: studErr || 'Failed to fetch students' }

  // Get attendance
  let query = supabase
    .from('student_attendance')
    .select('*')
    .eq('date', date)

  if (classId) {
    query = query.eq('class_id', classId)
  }

  const { data: attendance, error: attErr } = await query

  if (attErr) return { data: null, error: attErr.message }

  // Map to students
  const attendanceMap = new Map(attendance.map(a => [a.student_id, a.status]))

  const result = students.map((s) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    return {
      student_id:   s.id,
      student_code: s.student_id,
      class_id:     s.class_id,
      full_name:    profile?.full_name || s.father_name || 'Unknown',
      status:       attendanceMap.get(s.id) || null,
    }
  })

  return { data: result, error: null }
}

export async function saveAdminClassAttendance(date: string, records: { student_id: string, class_id: string, status: string }[]) {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const user = { id: auth.profile.id };
  const supabase = await createClient()

  const upserts = records.map(r => ({
    class_id: r.class_id,
    student_id: r.student_id,
    date,
    status: r.status as Database['public']['Enums']['attendance_status'],
    marked_by: user.id
  }))

  const { error } = await supabase
    .from('student_attendance')
    .upsert(upserts, { onConflict: 'student_id,date' })

  if (error) return { error: error.message }
  
  return { success: true }
}

export async function getStudentProfileData(studentId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { data: null, error: auth.error }

  const supabase = await createClient()

  const { data: student, error } = await supabase
    .from('students')
    .select(`
      *,
      classes ( class_name, section ),
      profiles (
        full_name,
        mobile,
        profile_photo_url,
        dob,
        address
      )
    `)
    .eq('id', studentId)
    .single()

  if (error) return { data: null, error: error.message }

  // Fetch email from auth users
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(student.profile_id)
  
  const studentProfile = {
    ...student,
    profiles: student.profiles ? {
      ...student.profiles,
      email: authUser?.user?.email || null
    } : null
  }

  // Fetch attendance records
  const { data: attendanceLogs } = await supabase
    .from('student_attendance')
    .select('id, date, status')
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  let present = 0, total = 0
  if (attendanceLogs) {
    total = attendanceLogs.length
    present = attendanceLogs.filter(a => a.status === 'present').length
  }
  const attPct = total === 0 ? 0 : Math.round((present / total) * 100)

  // Fetch fees
  const { data: fees } = await supabase
    .from('student_fees')
    .select('*')
    .eq('student_id', student.student_id)
    .order('due_date', { ascending: false })

  // Fetch results
  const { data: results } = await supabase
    .from('results')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  return {
    data: {
      student: studentProfile,
      attendanceStats: { present, total, percentage: attPct },
      attendanceLogs: attendanceLogs || [],
      fees: fees || [],
      results: results || [],
    },
    error: null,
  }
}

export async function uploadStudentResult(classId: string, studentId: string, data: { exam_type: Database['public']['Enums']['exam_type'], subject: string, marks_obtained: number, total_marks: number }) {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const user = { id: auth.profile.id };
  const supabase = await createClient()

  const { error } = await supabase.from('results').upsert({
    student_id: studentId,
    class_id: classId,
    exam_type: data.exam_type,
    subject: data.subject,
    marks_obtained: data.marks_obtained,
    total_marks: data.total_marks,
    is_approved: true, // Admin uploads are auto-approved
    approved_by: user.id
  }, { onConflict: 'student_id, exam_type, subject' })

  if (error) {
    console.error('[uploadStudentResult]', error)
    return { error: error.message }
  }
  return { success: true }
}

export async function getClassResults(classId?: string) {
  const auth = await requireAuth()
  if (!auth.ok) return { data: null, error: auth.error }
  if (auth.profile.role !== 'admin' && auth.profile.role !== 'teacher') {
    return { data: null, error: 'Forbidden: Admin or Teacher only' }
  }

  const supabase = await createClient()

  let query = supabase
    .from('results')
    .select(`
      *,
      students (
        student_id,
        father_name,
        mother_name,
        profiles ( full_name, dob, address )
      ),
      classes ( class_name, section )
    `)
    .order('created_at', { ascending: false })

  if (classId) {
    query = query.eq('class_id', classId)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteStudentResult(resultIds: string[]) {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };
  const supabase = await createClient()

  const { error } = await supabase.from('results').delete().in('id', resultIds)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getManageAttendanceRecords(classId?: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { data: null, error: auth.error };
  const supabase = await createClient()

  let query = supabase
    .from('student_attendance')
    .select(`
      *,
      students (
        student_id,
        profiles ( full_name )
      )
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (classId) {
    query = query.eq('class_id', classId)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function deleteAttendanceRecord(id: string) {
  const supabase = await createClient()
  
  // Lookup classId
  const { data: att } = await supabase.from('student_attendance').select('class_id').eq('id', id).single()
  if (!att) return { error: 'Record not found' }
  const auth = await requireTeacherForClass(att.class_id, { allowAdmin: true })
  if (!auth.ok) return { error: auth.error }

  const { error } = await supabase.from('student_attendance').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateAttendanceRecordStatus(id: string, status: Database['public']['Enums']['attendance_status']) {
  const supabase = await createClient()
  
  // Lookup classId
  const { data: att } = await supabase.from('student_attendance').select('class_id').eq('id', id).single()
  if (!att) return { error: 'Record not found' }
  const auth = await requireTeacherForClass(att.class_id, { allowAdmin: true })
  if (!auth.ok) return { error: auth.error }

  const { error } = await supabase.from('student_attendance').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
