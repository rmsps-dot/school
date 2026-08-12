'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/utils/auth-helpers'

// --------------------------------------------------------------------------------
// TEACHER DETAILS
// --------------------------------------------------------------------------------

export async function recordTeacherPayment(formData: FormData) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  const teacherId = formData.get('teacherId') as string
  const amount = parseFloat(formData.get('amount') as string)
  const paymentDate = formData.get('paymentDate') as string || new Date().toISOString()
  const remarks = formData.get('remarks') as string
  const status = formData.get('status') as string || 'paid'

  if (!teacherId || isNaN(amount) || amount <= 0) {
    return { error: 'Valid Teacher ID and Amount are required.' }
  }

  const { error } = await supabase.from('teacher_payments').insert({
    teacher_id: teacherId,
    amount,
    payment_date: paymentDate,
    status,
    remarks,
    recorded_by: auth.profile.id
  })

  if (error) return { error: error.message }

  // We need the profile ID to revalidate the path
  const { data: teacher } = await supabase.from('teachers').select('profile_id').eq('id', teacherId).single()
  if (teacher) {
    revalidatePath(`/admin/teachers/${teacher.profile_id}`)
  }
  
  return { success: true }
}

// --------------------------------------------------------------------------------
// PARENT DETAILS
// --------------------------------------------------------------------------------

export async function getParentDetails(profileId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { data: null, error: auth.error }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('parents')
    .select(`
      *,
      profiles (*),
      parent_students (
        students (
          id, profile_id, student_id,
          profiles (full_name, profile_photo_url, mobile),
          classes (class_name, section)
        )
      )
    `)
    .eq('profile_id', profileId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
