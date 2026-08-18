'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireAdmin } from '@/utils/auth-helpers'

import type { Database, Json } from '@/types/supabase'

export type AppSetting = Database['public']['Tables']['settings']['Row']

export interface TeacherAttendanceSetting {
  [key: string]: Json | undefined
  start_time: string
  end_time: string
  location_name: string
  lat: number | null
  lng: number | null
  radius_meters: number
}

export interface StudentAttendanceSetting {
  [key: string]: Json | undefined
  start: string
  end: string
}

export async function getSettings() {
  const auth = await requireAuth()
  if (!auth.ok) return { data: null, error: auth.error }
  
  const supabase = await createClient()
  const { data, error } = await supabase.from('settings').select('*')
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getTeacherAttendanceSetting(): Promise<{
  data: TeacherAttendanceSetting | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'teacher_attendance_setting')
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    if (!data || !data.value) return { data: null, error: null }

    const raw = data.value as unknown as Partial<TeacherAttendanceSetting>
    const parsed: TeacherAttendanceSetting = {
      start_time: typeof raw.start_time === 'string' ? raw.start_time : '06:00',
      end_time: typeof raw.end_time === 'string' ? raw.end_time : '09:30',
      location_name: typeof raw.location_name === 'string' ? raw.location_name : '',
      lat: typeof raw.lat === 'number' ? raw.lat : null,
      lng: typeof raw.lng === 'number' ? raw.lng : null,
      radius_meters: typeof raw.radius_meters === 'number' && raw.radius_meters > 0 ? raw.radius_meters : 50,
    }

    return { data: parsed, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch teacher settings' }
  }
}

export async function updateSetting(key: string, value: Json) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  const { error } = await supabase
    .from('settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })

  if (error) return { error: error.message }
  
  revalidatePath('/admin/settings')
  revalidatePath('/teacher/attendance')
  revalidatePath('/teacher/class-attendance')
  return { success: true }
}
