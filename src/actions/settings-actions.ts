'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireAdmin } from '@/utils/auth-helpers'

import type { Database, Json } from '@/types/supabase'

export type AppSetting = Database['public']['Tables']['settings']['Row']

export async function getSettings() {
  const auth = await requireAuth()
  if (!auth.ok) return { data: null, error: auth.error }
  
  const supabase = await createClient()
  const { data, error } = await supabase.from('settings').select('*')
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateSetting(key: string, value: Json) {
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
