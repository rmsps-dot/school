'use server'

import { createClient } from '@/utils/supabase/server'
import { requireSelfOrGuardianOf } from '@/utils/auth-helpers'

export interface FeeRecord {
  id: string
  student_id: string
  fee_name: string
  amount: number
  paid_amount: number
  due_date: string
  status: 'paid' | 'due' | 'upcoming'
}

export async function getStudentFees(studentIdStr: string): Promise<{ data: FeeRecord[]; error?: string }> {
  try {
    const auth = await requireSelfOrGuardianOf(studentIdStr, { allowAdmin: true, allowTeacher: true })
    if (!auth.ok) return { data: [], error: auth.error }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('student_fees')
      .select('*')
      .eq('student_id', studentIdStr)
      .order('due_date', { ascending: true })

    if (error) throw error

    return { data: data || [] }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
