'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { haversine } from '@/utils/helpers'
import { supabaseAdmin } from '@/utils/supabase/admin'

export interface AttendanceResult {
  success: boolean
  error?: string
  alreadyMarked?: boolean
}

import { requireTeacher } from '@/utils/auth-helpers'

/* ── Helper: verify caller is a teacher, return their teacher row ── */
async function getTeacherId() {
  const auth = await requireTeacher()
  if (!auth.ok) throw new Error(auth.error)

  const supabase = await createClient()
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('profile_id', auth.profile.id)
    .maybeSingle()

  if (!teacher) {
    throw new Error('Your teacher profile is incomplete. No associated teacher record found. Please contact the administrator.')
  }

  return { user: auth.profile, teacher }
}

/* ─────────────────────────────────────────────────────────────
   CHECK TODAY'S ATTENDANCE  (called on page load)
───────────────────────────────────────────────────────────── */
import type { Database } from '@/types/supabase'

export async function getTodayAttendance(): Promise<{
  marked: boolean
  record?: {
    status: Database['public']['Enums']['attendance_status']
    check_in_at: string | null
    photo_url: string | null
    location_lat: number | null
    location_lng: number | null
  }
  error?: string
}> {
  try {
    const { teacher } = await getTeacherId()
    const today = new Date().toISOString().split('T')[0]
    const supabase = await createClient()

    const { data } = await supabase
      .from('teacher_attendance')
      .select('status, check_in_at, photo_url, location_lat, location_lng')
      .eq('teacher_id', teacher.id)
      .eq('date', today)
      .maybeSingle()

    return { marked: !!data, record: data ?? undefined }
  } catch (err) {
    return { marked: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function getTeacherProfile() {
  try {
    const { teacher } = await getTeacherId()
    const supabase = await createClient()

    const { data: teacherData, error } = await supabase
      .from('teachers')
      .select(`
        *,
        profiles (
          full_name,
          mobile,
          address,
          dob,
          profile_photo_url
        )
      `)
      .eq('id', teacher.id)
      .single()

    if (error) throw error

    // Fetch the user's email safely using their own session
    const { data: { user } } = await supabase.auth.getUser()
    
    const profile = Array.isArray(teacherData.profiles) 
      ? teacherData.profiles[0] 
      : teacherData.profiles

    const teacherProfile = {
      ...teacherData,
      profiles: profile ? {
        ...profile,
        email: user?.email || null
      } : null
    }

    return { data: teacherProfile, error: null }
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { data: null, error: err.message }
    }
    return { data: null, error: 'Failed to fetch teacher profile' }
  }
}

/* ─────────────────────────────────────────────────────────────
   MARK TEACHER ATTENDANCE
   - Idempotent: uses upsert so double-clicks don't duplicate
   - Validates geofence server-side as a second line of defence
───────────────────────────────────────────────────────────── */
export async function markTeacherAttendance(payload: {
  lat: number
  lng: number
  photoUrl: string
  distanceMeters: number
}): Promise<AttendanceResult> {
  try {
    const { teacher } = await getTeacherId()
    const supabase = await createClient()

    // Server-side geofence guard (50 m — school building boundary)
    const SCHOOL_LAT = 26.1121
    const SCHOOL_LNG = 86.6069
    const MAX_DIST   = 50

    const dist = haversine(payload.lat, payload.lng, SCHOOL_LAT, SCHOOL_LNG)
    if (dist > MAX_DIST) {
      return {
        success: false,
        error: `Aap school premises ke bahar hain (${Math.round(dist)} m). Attendance mark nahi ho sakti.`,
      }
    }

    const today = new Date().toISOString().split('T')[0]

    // Check for duplicate
    const { data: existing } = await supabase
      .from('teacher_attendance')
      .select('id')
      .eq('teacher_id', teacher.id)
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      return { success: true, alreadyMarked: true }
    }

    const { error } = await supabase.from('teacher_attendance').insert({
      teacher_id:   teacher.id,
      date:         today,
      status:       'present',
      check_in_at:  new Date().toISOString(),
      location_lat: payload.lat,
      location_lng: payload.lng,
      photo_url:    payload.photoUrl,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/teacher/attendance')
    revalidatePath('/teacher')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[markTeacherAttendance]', msg)
    return { success: false, error: msg }
  }
}

/* ─────────────────────────────────────────────────────────────
   TEACHER UPDATE STUDENT DETAILS
───────────────────────────────────────────────────────────── */
export async function teacherUpdateStudent(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const { teacher } = await getTeacherId()
    const supabase = await createClient()

    const studentIdRow = formData.get('studentIdRow') as string
    const fullName = formData.get('fullName') as string
    const studentId = formData.get('studentId') as string
    const fatherName = formData.get('fatherName') as string
    const motherName = formData.get('motherName') as string
    const address = formData.get('address') as string
    const phone = formData.get('phone') as string
    const dob = formData.get('dob') as string

    if (!studentIdRow) {
      return { error: 'Student record identifier is required.' }
    }

    if (!fullName || !fullName.trim()) {
      return { error: 'Full Name is required.' }
    }

    if (!studentId || !studentId.trim()) {
      return { error: 'Roll / Student ID is required.' }
    }

    // Verify student exists and get trusted profile_id + class_id
    const { data: studentRecord, error: studentFetchErr } = await supabase
      .from('students')
      .select('id, class_id, profile_id')
      .eq('id', studentIdRow)
      .single()

    if (studentFetchErr || !studentRecord) {
      return { error: 'Student record not found.' }
    }

    if (!studentRecord.profile_id) {
      return { error: 'Student profile is not linked. Please contact the administrator.' }
    }

    // Verify this teacher is assigned to student's class
    const { data: classAssigned } = await supabase
      .from('teacher_classes')
      .select('class_id')
      .eq('teacher_id', teacher.id)
      .eq('class_id', studentRecord.class_id)
      .maybeSingle()

    if (!classAssigned) {
      return { error: 'You are only authorized to edit students in your assigned classes.' }
    }

    // 1. Update Profile (using trusted profile_id from DB record)
    const { error: profileError } = await supabaseAdmin.from('profiles').update({
      full_name: fullName.trim(),
      mobile: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
      dob: dob || null,
    }).eq('id', studentRecord.profile_id)

    if (profileError) {
      return { error: profileError.message }
    }

    // 2. Update Student
    const { error: studentUpdateErr } = await supabaseAdmin.from('students').update({
      student_id: studentId.trim(),
      father_name: fatherName ? fatherName.trim() : null,
      mother_name: motherName ? motherName.trim() : null,
    }).eq('id', studentIdRow)

    if (studentUpdateErr) {
      return { error: studentUpdateErr.message }
    }

    revalidatePath('/teacher/students')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update student'
    console.error('[teacherUpdateStudent]', msg)
    return { error: msg }
  }
}
