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
    
    const teacherProfile = {
      ...teacherData,
      profiles: teacherData.profiles ? {
        ...teacherData.profiles,
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
