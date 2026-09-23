'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin as adminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin, getAuthUserEmailMap } from '@/utils/auth-helpers'
import { randomBytes } from 'crypto'
import { sendParentCredentials, sendPasswordResetEmail } from '@/utils/mailer'



// --------------------------------------------------------------------------------
// STUDENTS
// --------------------------------------------------------------------------------
export async function getAllStudents() {
  const auth = await requireAdmin()
  if (!auth.ok) return { data: null, error: auth.error }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      profiles (*),
      classes (class_name, section)
    `)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function addStudent(formData: FormData) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const classId = formData.get('classId') as string
  const customStudentId = formData.get('studentId') as string
  const fatherName = formData.get('fatherName') as string
  const motherName = formData.get('motherName') as string
  const address = formData.get('address') as string
  const phone = formData.get('phone') as string
  const dob = formData.get('dob') as string

  // Auto-generate student ID if not provided: STU-YYYY-XXXX
  let studentId = customStudentId?.trim()
  if (!studentId) {
    const year = new Date().getFullYear()
    const timestampSuffix = Date.now().toString().slice(-4)
    studentId = `STU-${year}-${timestampSuffix}`
  }

  // Parent credentials
  const createParent = formData.get('createParent') === 'on'
  const parentEmail = formData.get('parentEmail') as string
  const parentPassword = formData.get('parentPassword') as string

  const adminAuthClient = adminClient

  // 1. Create Student Auth User
  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'student' }
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Failed to create student auth user' }

  // 2. Create Parent Auth User (if requested)
  let parentAuthData = null
  if (createParent && parentEmail && parentPassword) {
    const res = await adminAuthClient.auth.admin.createUser({
      email: parentEmail,
      password: parentPassword,
      email_confirm: true,
      user_metadata: { full_name: fatherName || motherName || 'Parent', role: 'parent' }
    })
    
    if (res.error) {
      // Rollback student
      await adminAuthClient.auth.admin.deleteUser(authData.user.id)
      return { error: `Failed to create parent: ${res.error.message}` }
    }
    parentAuthData = res.data
  }

  // 3. Explicitly upsert the profiles row — don't rely on a trigger race.
  //    If the trigger already ran, this is a no-op update. If we're first,
  //    we create the row and the trigger's later insert will be ignored.
  const { error: profileUpsertError } = await adminAuthClient.from('profiles').upsert({
    id: authData.user.id,
    full_name: fullName,
    role: 'student',
    mobile: phone || null,
    address: address || null,
    dob: dob || null,
  }, { onConflict: 'id' })

  if (profileUpsertError) {
    // Rollback auth user if profiles row can't be created
    await adminAuthClient.auth.admin.deleteUser(authData.user.id)
    if (parentAuthData?.user) await adminAuthClient.auth.admin.deleteUser(parentAuthData.user.id)
    return { error: `Failed to create student profile: ${profileUpsertError.message}` }
  }

  const { data: studentRecord, error: studentError } = await supabase.from('students').insert({
    profile_id: authData.user.id,
    class_id: classId,
    student_id: studentId,
    father_name: fatherName,
    mother_name: motherName
  }).select('id').single()

  if (studentError) {
    // Rollback auth users
    await adminAuthClient.auth.admin.deleteUser(authData.user.id)
    if (parentAuthData?.user) await adminAuthClient.auth.admin.deleteUser(parentAuthData.user.id)
    return { error: studentError.message }
  }

  // 4. Map parent to student if parent was created
  if (parentAuthData?.user && studentRecord) {
    // The trigger only creates the profile. We must manually create the parent row.
    const { data: newParent, error: parentInsertError } = await supabase.from('parents').insert({
      profile_id: parentAuthData.user.id
    }).select('id').single()
    
    if (newParent && !parentInsertError) {
      await supabase.from('parent_students').insert({
        parent_id: newParent.id,
        student_id: studentRecord.id
      })
    }
  }

  revalidatePath('/admin/students')
  return { success: true }
}
export async function updateStudent(formData: FormData) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const profileId = formData.get('profileId') as string
  const fullName = formData.get('fullName') as string
  const classId = formData.get('classId') as string
  const studentId = formData.get('studentId') as string
  const fatherName = formData.get('fatherName') as string
  const motherName = formData.get('motherName') as string
  const address = formData.get('address') as string
  const phone = formData.get('phone') as string
  const dob = formData.get('dob') as string

  if (!profileId) return { error: 'Profile ID is required' }

  // 1. Update Profile
  const { error: profileError } = await supabase.from('profiles').update({
    full_name: fullName,
    mobile: phone,
    address: address,
    dob: dob || null
  }).eq('id', profileId)

  if (profileError) return { error: profileError.message }

  // 2. Update Student
  const { error: studentError } = await supabase.from('students').update({
    class_id: classId,
    student_id: studentId,
    father_name: fatherName,
    mother_name: motherName
  }).eq('profile_id', profileId)

  if (studentError) return { error: studentError.message }

  revalidatePath('/admin/students')
  revalidatePath('/admin/classes')
  return { success: true }
}

export async function deleteStudent(profileId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminAuthClient = adminClient

  try {
    // 1. Fetch user's email from Auth to clean up pending_registrations
    const { data: userData } = await adminAuthClient.auth.admin.getUserById(profileId)
    const email = userData?.user?.email

    // 2. Find student record in 'students' table
    const { data: sRow } = await adminAuthClient
      .from('students')
      .select('id, student_id')
      .eq('profile_id', profileId)
      .maybeSingle()

    if (sRow?.id) {
      await adminAuthClient.from('parent_students').delete().eq('student_id', sRow.id)
      await adminAuthClient.from('student_attendance').delete().eq('student_id', sRow.id)
      await adminAuthClient.from('results').delete().eq('student_id', sRow.id)
      if (sRow.student_id) {
        await adminAuthClient.from('student_fees').delete().eq('student_id', sRow.student_id)
      }
      await adminAuthClient.from('students').delete().eq('id', sRow.id)
    }

    // 3. Clean up pending_registrations for this email or mobile so student can re-register
    if (email) {
      await adminAuthClient
        .from('pending_registrations')
        .delete()
        .ilike('student_email', email.trim())
    } else {
      const { data: prof } = await adminAuthClient
        .from('profiles')
        .select('mobile')
        .eq('id', profileId)
        .maybeSingle()
      if (prof?.mobile) {
        await adminAuthClient
          .from('pending_registrations')
          .delete()
          .eq('student_mobile', prof.mobile)
      }
    }

    // 4. Clean up other user relations
    await adminAuthClient.from('profile_change_requests').delete().eq('user_id', profileId)
    await adminAuthClient.from('messages').delete().or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)

    // 5. Delete profile record
    await adminAuthClient.from('profiles').delete().eq('id', profileId)

    // 6. Delete from Supabase Auth (ignore if already deleted manually)
    const { error: authErr } = await adminAuthClient.auth.admin.deleteUser(profileId)
    if (authErr && !authErr.message.toLowerCase().includes('not found')) {
      return { error: authErr.message }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/requests')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete student'
    return { error: msg }
  }
}

// --------------------------------------------------------------------------------
// TEACHERS
// --------------------------------------------------------------------------------
export async function getAllTeachers() {
  const auth = await requireAdmin()
  if (!auth.ok) return { data: null, error: auth.error }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      mobile,
      address,
      dob,
      profile_photo_url,
      created_at,
      teachers (
        id,
        teacher_id,
        qualification,
        joining_date,
        teacher_classes ( class_id, subject, classes ( id, class_name, section ) )
      )
    `)
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const formattedData = data?.map(profile => {
    // Supabase returns 1-to-1 as an object or array depending on the exact schema definition
    const teacherData = Array.isArray(profile.teachers) ? profile.teachers[0] : profile.teachers
    
    return {
      id: teacherData?.id || profile.id,
      profile_id: profile.id,
      teacher_id: teacherData?.teacher_id || 'Incomplete Profile (Delete & Recreate)',
      qualification: teacherData?.qualification || '',
      joining_date: teacherData?.joining_date || null,
      profiles: {
        full_name: profile.full_name,
        avatar_url: profile.profile_photo_url,
        mobile: profile.mobile,
        address: profile.address,
        dob: profile.dob,
      },
      teacher_classes: teacherData?.teacher_classes || []
    }
  }) || []

  return { data: formattedData, error: null }
}

export async function getTeacherDetails(profileId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { data: null, error: auth.error }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      profile_photo_url,
      dob,
      mobile,
      address,
      created_at,
      teachers (
        id,
        teacher_id,
        qualification,
        joining_date,
        teacher_classes ( class_id, subject, classes ( id, class_name, section ) ),
        teacher_attendance ( id, date, status, check_in_at, photo_url ),
        teacher_payments ( id, amount, payment_date, status, remarks )
      )
    `)
    .eq('id', profileId)
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Teacher not found' }

  const teacherData = Array.isArray(data.teachers) ? data.teachers[0] : data.teachers

  const formattedData = {
    id: teacherData?.id || data.id,
    profile_id: data.id,
    teacher_id: teacherData?.teacher_id || 'N/A',
    qualification: teacherData?.qualification || '',
    joining_date: teacherData?.joining_date,
    profiles: {
      full_name: data.full_name,
      avatar_url: data.profile_photo_url,
      dob: data.dob,
      mobile: data.mobile,
      address: data.address,
    },
    teacher_classes: teacherData?.teacher_classes || [],
    teacher_attendance: teacherData?.teacher_attendance || [],
    teacher_payments: teacherData?.teacher_payments || []
  }

  return { data: formattedData, error: null }
}

export async function addTeacher(formData: FormData) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const qualification = formData.get('qualification') as string
  const joiningDate = formData.get('joiningDate') as string
  const dob = formData.get('dob') as string
  const mobile = formData.get('mobile') as string
  const address = formData.get('address') as string

  // Auto-generate Teacher ID
  const { data: lastTeacher } = await supabase
    .from('teachers')
    .select('teacher_id')
    .order('teacher_id', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  let teacherId = 'TCH-0001'
  if (lastTeacher && lastTeacher.teacher_id && lastTeacher.teacher_id.startsWith('TCH-')) {
     const lastNum = parseInt(lastTeacher.teacher_id.replace('TCH-', ''), 10)
     if (!isNaN(lastNum)) {
       teacherId = `TCH-${String(lastNum + 1).padStart(4, '0')}`
     }
  }

  const adminAuthClient = adminClient

  // 1. Create Auth User
  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'teacher' }
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Failed to create auth user' }

  // 2. Explicitly upsert the profiles row — don't rely on a trigger race.
  const { error: profileUpsertError } = await adminAuthClient.from('profiles').upsert({
    id: authData.user.id,
    full_name: fullName,
    role: 'teacher',
    dob: dob || null,
    mobile: mobile || null,
    address: address || null,
  }, { onConflict: 'id' })

  if (profileUpsertError) {
    await adminAuthClient.auth.admin.deleteUser(authData.user.id)
    return { error: `Failed to create teacher profile: ${profileUpsertError.message}` }
  }

  const insertData: import('@/types/supabase').Database['public']['Tables']['teachers']['Insert'] = {
    profile_id: authData.user.id,
    teacher_id: teacherId,
    qualification,
  }
  if (joiningDate) {
    insertData.joining_date = new Date(joiningDate).toISOString()
  }

  const { error: teacherError } = await supabase.from('teachers').insert(insertData)

  if (teacherError) {
    // Rollback auth user
    await adminAuthClient.auth.admin.deleteUser(authData.user.id)
    return { error: teacherError.message }
  }

  revalidatePath('/admin/teachers')
  return { success: true }
}

export async function updateTeacherProfile(
  profileId: string,
  data: {
    full_name: string
    qualification: string
    mobile?: string | null
    address?: string | null
    dob?: string | null
    joining_date?: string | null
  }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }
    const supabase = await createClient()

    // 1. Update Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name.trim(),
        mobile: data.mobile?.trim() || null,
        address: data.address?.trim() || null,
        dob: data.dob || null,
      })
      .eq('id', profileId)

    if (profileError) return { success: false, error: profileError.message }

    // 2. Update Teacher Row
    const teacherUpdatePayload: import('@/types/supabase').Database['public']['Tables']['teachers']['Update'] = {
      qualification: data.qualification.trim(),
    }
    if (data.joining_date) {
      teacherUpdatePayload.joining_date = new Date(data.joining_date).toISOString()
    }

    const { error: teacherError } = await supabase
      .from('teachers')
      .update(teacherUpdatePayload)
      .eq('profile_id', profileId)

    if (teacherError) return { success: false, error: teacherError.message }

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update teacher profile' }
  }
}

export async function deleteTeacher(profileId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminAuthClient = adminClient

  try {
    const { data: tRow } = await adminAuthClient
      .from('teachers')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle()

    if (tRow?.id) {
      await adminAuthClient.from('teacher_classes').delete().eq('teacher_id', tRow.id)
      await adminAuthClient.from('teacher_attendance').delete().eq('teacher_id', tRow.id)
      await adminAuthClient.from('teachers').delete().eq('id', tRow.id)
    }

    await adminAuthClient.from('profile_change_requests').delete().eq('user_id', profileId)
    await adminAuthClient.from('messages').delete().or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
    await adminAuthClient.from('profiles').delete().eq('id', profileId)

    const { error: authErr } = await adminAuthClient.auth.admin.deleteUser(profileId)
    if (authErr && !authErr.message.toLowerCase().includes('not found')) {
      return { error: authErr.message }
    }

    revalidatePath('/admin/teachers')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete teacher'
    return { error: msg }
  }
}

// --------------------------------------------------------------------------------
// PARENTS
// --------------------------------------------------------------------------------
export async function getAllParents() {
  const auth = await requireAdmin()
  if (!auth.ok) return { data: null, error: auth.error }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('parents')
    .select(`
      *,
      profiles (*),
      parent_students ( students ( profile_id, student_id, profiles (full_name, profile_photo_url) ) )
    `)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  
  // Fetch emails from auth.users using admin client
  const adminAuthClient = adminClient
  const emailMap = await getAuthUserEmailMap()

  // Flatten data to match the UI expectation
  const formattedData = data.map(p => ({
    id: p.profile_id,
    parent_id: p.id,
    full_name: p.profiles?.full_name,
    avatar_url: p.profiles?.profile_photo_url,
    email: emailMap.get(p.profile_id) || p.profiles?.email || null,
    mobile: p.profiles?.mobile,
    address: p.profiles?.address,
    dob: p.profiles?.dob,
    parent_students: p.parent_students
  }))

  return { data: formattedData, error: null }
}

export async function updateParentProfile(profileId: string, data: {
  full_name: string;
  mobile: string | null;
  address: string | null;
  dob: string | null;
}) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      mobile: data.mobile,
      address: data.address,
      dob: data.dob
    })
    .eq('id', profileId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/parents', 'layout')
  return { success: true }
}

export async function deleteParent(profileId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  const adminAuthClient = adminClient

  try {
    const { data: pRow } = await adminAuthClient
      .from('parents')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle()

    if (pRow?.id) {
      await adminAuthClient.from('parent_students').delete().eq('parent_id', pRow.id)
      await adminAuthClient.from('parents').delete().eq('id', pRow.id)
    }

    await adminAuthClient.from('profile_change_requests').delete().eq('user_id', profileId)
    await adminAuthClient.from('messages').delete().or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
    await adminAuthClient.from('profiles').delete().eq('id', profileId)

    const { error: authErr } = await adminAuthClient.auth.admin.deleteUser(profileId)
    if (authErr && !authErr.message.toLowerCase().includes('not found')) {
      return { error: authErr.message }
    }

    revalidatePath('/admin/parents')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete parent'
    return { error: msg }
  }
}

export async function sendPasswordResetLink(profileId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const adminAuthClient = adminClient
  
  // Get user's email from Auth
  const { data: userData, error: userError } = await adminAuthClient.auth.admin.getUserById(profileId)
  if (userError || !userData?.user) return { error: userError?.message || 'User not found' }

  const email = userData.user.email
  if (!email) return { error: 'User does not have an email address' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://rmsps.vercel.app'

  // Get recipient profile name for email greeting
  const { data: profile } = await adminAuthClient
    .from('profiles')
    .select('full_name')
    .eq('id', profileId)
    .maybeSingle()

  const recipientName = profile?.full_name || userData.user.user_metadata?.full_name || 'User'

  // Generate secure direct recovery link (bypasses browser-locked PKCE storage errors)
  const { data: linkData, error: linkError } = await adminAuthClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${siteUrl}/reset-password`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return { error: linkError?.message || 'Failed to generate password reset link' }
  }

  // Send branded email with direct recovery link via verified Gmail SMTP
  const mailRes = await sendPasswordResetEmail(email, recipientName, linkData.properties.action_link)
  if (!mailRes.success) {
    return { error: mailRes.error || 'Failed to send password reset email via SMTP' }
  }
  
  return { success: true, email }
}

/**
 * Public action: allows a user requesting password reset from login/forgot-password
 * to receive a reliable recovery link via verified SMTP and admin.generateLink.
 * This completely avoids the Next.js client-side PKCE storage verifier mismatch bug.
 */
export async function requestPasswordResetAction(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    const adminAuthClient = adminClient
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://rmsps.vercel.app'

    // Look up user to see if they exist and get full_name
    const { data: userList, error: listError } = await adminAuthClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listError) {
      return { success: false, error: 'Service temporarily unavailable. Please try again later.' }
    }

    const matchedUser = userList.users.find(u => u.email?.toLowerCase() === cleanEmail)
    if (!matchedUser) {
      // Return success with generic message to avoid email enumeration
      return { success: true }
    }

    const { data: profile } = await adminAuthClient
      .from('profiles')
      .select('full_name')
      .eq('id', matchedUser.id)
      .maybeSingle()

    const recipientName = profile?.full_name || matchedUser.user_metadata?.full_name || 'User'

    const { data: linkData, error: linkError } = await adminAuthClient.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${siteUrl}/reset-password`,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      return { success: false, error: linkError?.message || 'Failed to generate reset link.' }
    }

    const mailRes = await sendPasswordResetEmail(cleanEmail, recipientName, linkData.properties.action_link)
    if (!mailRes.success) {
      return { success: false, error: mailRes.error || 'Failed to send reset email.' }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'An unexpected error occurred.' }
  }
}

export async function linkStudentToParent(parentTableId: string, studentProfileId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  // Need to get the student's actual student UUID (not profile ID)
  const { data: studentRecord } = await supabase.from('students').select('id').eq('profile_id', studentProfileId).single()
  if (!studentRecord) return { error: 'Student not found in DB' }

  const { error } = await supabase.from('parent_students').insert({
    parent_id: parentTableId,
    student_id: studentRecord.id
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/parents')
  return { success: true }
}

interface LinkedStudentProfileItem {
  students: {
    profiles: { full_name: string | null }[] | { full_name: string | null } | null
  } | null
}

export async function sendParentDirectCredentials(
  profileId: string,
  customPassword?: string,
  customEmail?: string
): Promise<{
  success?: boolean
  error?: string
  email?: string
  password?: string
  emailSent?: boolean
  emailError?: string
}> {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const adminAuthClient = adminClient

  // 1. Get user from Supabase Auth
  const { data: userData, error: userError } = await adminAuthClient.auth.admin.getUserById(profileId)
  const email = customEmail?.trim() || userData?.user?.email

  if (!email) {
    return { error: userError?.message || 'Parent user account not found or has no email' }
  }

  // 2. Generate password or use custom password
  const newPassword =
    customPassword && customPassword.trim().length >= 6
      ? customPassword.trim()
      : `RMSPS@${randomBytes(4).toString('hex')}!`

  // 3. Update password directly in Supabase Auth (and email if customEmail provided)
  const updatePayload: { password: string; email?: string } = {
    password: newPassword,
  }
  if (customEmail && userData?.user?.email?.toLowerCase() !== customEmail.trim().toLowerCase()) {
    updatePayload.email = customEmail.trim().toLowerCase()
  }

  const { error: updateError } = await adminAuthClient.auth.admin.updateUserById(profileId, updatePayload)

  if (updateError) {
    return { error: `Failed to set parent password: ${updateError.message}` }
  }

  // 4. Get parent profile name and linked student name(s)
  const { data: profile } = await adminAuthClient
    .from('profiles')
    .select('full_name')
    .eq('id', profileId)
    .maybeSingle()

  const { data: parentRow } = await adminAuthClient
    .from('parents')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()

  let studentNames = 'your child'
  if (parentRow?.id) {
    const { data: linked } = await adminAuthClient
      .from('parent_students')
      .select('students (profiles (full_name))')
      .eq('parent_id', parentRow.id)

    if (linked && linked.length > 0) {
      const names = (linked as unknown as LinkedStudentProfileItem[])
        ?.map((item) => {
          const prof = item?.students?.profiles
          if (Array.isArray(prof)) return prof[0]?.full_name
          return prof?.full_name
        })
        .filter((n): n is string => typeof n === 'string' && n.length > 0)

      if (names && names.length > 0) {
        studentNames = names.join(', ')
      }
    }
  }

  // 5. Send credentials via email using our verified Gmail SMTP
  const emailRes = await sendParentCredentials(
    email,
    profile?.full_name || 'Parent',
    studentNames,
    newPassword
  )

  revalidatePath('/admin/parents')

  return {
    success: true,
    email,
    password: newPassword,
    emailSent: emailRes.success,
    emailError: emailRes.error,
  }
}

