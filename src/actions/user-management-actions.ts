'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin as adminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/utils/auth-helpers'

function getAdminAuthClient() {
  return adminClient
}

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
    const { count } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .then((r) => ({ count: r.count ?? 0 }))
    studentId = `STU-${year}-${String(count + 1).padStart(4, '0')}`
  }

  // Parent credentials
  const createParent = formData.get('createParent') === 'on'
  const parentEmail = formData.get('parentEmail') as string
  const parentPassword = formData.get('parentPassword') as string

  const adminAuthClient = getAdminAuthClient()

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
  const supabase = await createClient()

  const adminAuthClient = getAdminAuthClient()
  const { error } = await adminAuthClient.auth.admin.deleteUser(profileId)
  
  if (error) return { error: error.message }

  revalidatePath('/admin/students')
  return { success: true }
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
      profile_photo_url,
      created_at,
      teachers (
        id,
        teacher_id,
        qualification,
        teacher_classes ( subject, classes ( class_name, section ) )
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
      profiles: {
        full_name: profile.full_name,
        avatar_url: profile.profile_photo_url,
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
        teacher_classes ( subject, classes ( class_name, section ) ),
        teacher_attendance ( id, date, status, check_in_at, photo_url ),
        teacher_payments ( id, amount, month, payment_date, status, remarks )
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

  const adminAuthClient = getAdminAuthClient()

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

export async function deleteTeacher(profileId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const adminAuthClient = getAdminAuthClient()
  const { error } = await adminAuthClient.auth.admin.deleteUser(profileId)
  
  if (error) return { error: error.message }

  revalidatePath('/admin/teachers')
  return { success: true }
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
  
  // Flatten data to match the UI expectation
  const formattedData = data.map(p => ({
    id: p.profile_id,
    parent_id: p.id,
    full_name: p.profiles?.full_name,
    avatar_url: p.profiles?.profile_photo_url,
    email: p.profiles?.email,
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
  const supabase = await createClient()

  const adminAuthClient = getAdminAuthClient()
  const { error } = await adminAuthClient.auth.admin.deleteUser(profileId)
  
  if (error) return { error: error.message }

  revalidatePath('/admin/parents')
  return { success: true }
}

export async function sendPasswordResetLink(profileId: string) {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }
  const adminAuthClient = getAdminAuthClient()
  
  // Get user's email from Auth
  const { data: userData, error: userError } = await adminAuthClient.auth.admin.getUserById(profileId)
  if (userError || !userData?.user) return { error: userError?.message || 'User not found' }

  const email = userData.user.email
  if (!email) return { error: 'User does not have an email address' }

  const { error } = await adminAuthClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
  })
  
  if (error) return { error: error.message }
  return { success: true, email }
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
