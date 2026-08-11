'use server'

import { createClient } from '@/utils/supabase/server'

interface RegistrationPayload {
  studentName: string
  studentDob: string
  studentEmail: string
  studentMobile: string
  studentAddress: string
  fatherName: string
  motherName: string
  parentMobile: string
  parentEmail: string
}

/**
 * Server action: submits a pending registration ONLY if the caller
 * is authenticated (i.e., they passed OTP verification).
 * This prevents unauthenticated fake form submissions.
 */
export async function submitRegistration(data: RegistrationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify the caller is authenticated (OTP must have been completed)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Session not found. Please complete email verification first.' }
    }

    // 2. Verify the authenticated email matches the student email (prevents impersonation)
    if (user.email?.toLowerCase() !== data.studentEmail.toLowerCase()) {
      return { success: false, error: 'Email mismatch. Please restart registration.' }
    }

    // 3. Server-side same-email guard
    if (data.studentEmail.toLowerCase() === data.parentEmail.toLowerCase()) {
      return { success: false, error: 'Student email and parent email cannot be the same.' }
    }

    // 4. Check if this email already has an approved/pending registration
    const { data: existing } = await supabase
      .from('pending_registrations')
      .select('id, status')
      .eq('student_email', data.studentEmail.toLowerCase())
      .in('status', ['pending', 'approved'])
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        error: existing.status === 'approved'
          ? 'This email already has an approved account. Please login instead.'
          : 'A pending application already exists for this email.'
      }
    }

    // 5. Insert into pending_registrations
    const { error: dbErr } = await supabase
      .from('pending_registrations')
      .insert({
        student_name:   data.studentName.trim(),
        student_dob:    data.studentDob,
        student_email:  data.studentEmail.trim().toLowerCase(),
        student_mobile: data.studentMobile.trim(),
        address:        data.studentAddress.trim(),
        father_name:    data.fatherName.trim(),
        mother_name:    data.motherName.trim(),
        parent_mobile:  data.parentMobile.trim(),
        parent_email:   data.parentEmail.trim().toLowerCase(),
        status:         'pending',
      })

    if (dbErr) {
      return { success: false, error: dbErr.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
