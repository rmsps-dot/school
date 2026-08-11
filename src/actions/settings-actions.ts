'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireAdmin } from '@/utils/auth-helpers'

export interface AppSetting {
  id: string
  key: string
  value: any
  created_at: string
  updated_at: string
}

export async function getSettings() {
  const auth = await requireAuth()
  if (!auth.ok) return { data: null, error: auth.error }
  
  const supabase = await createClient()
  const { data, error } = await supabase.from('settings').select('*')
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export async function updateSetting(key: string, value: JsonValue) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  const { error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/settings')
  return { success: true }
}
