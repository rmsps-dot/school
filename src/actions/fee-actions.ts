'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { requireSelfOrGuardianOf } from '@/utils/auth-helpers'
import type { Database } from '@/types/supabase'

export type FeeRecord = Database['public']['Tables']['student_fees']['Row'] & {
  status: 'paid' | 'due' | 'upcoming'
}

export async function getStudentFees(studentIdStr: string): Promise<{ data: FeeRecord[]; error?: string }> {
  try {
    const auth = await requireSelfOrGuardianOf(studentIdStr, { allowAdmin: true, allowTeacher: true })
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentIdStr)
    const { data: st } = await supabase
      .from('students')
      .select('id, student_id')
      .eq(isUuid ? 'id' : 'student_id', studentIdStr)
      .maybeSingle()

    const targetIds = new Set<string>([studentIdStr])
    if (st?.student_id) targetIds.add(st.student_id)
    if (st?.id) targetIds.add(st.id)

    const { data, error } = await supabase
      .from('student_fees')
      .select('*')
      .in('student_id', Array.from(targetIds))
      .order('due_date', { ascending: true })

    if (error) throw error

    return { data: (data ?? []) as FeeRecord[] }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
