'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { sendParentCredentials } from '@/utils/mailer'
import { requireAdmin } from '@/utils/auth-helpers'

/* ── Types ──────────────────────────────────────────── */
export interface ActionResult {
  success: boolean
  error?: string
}

/* ── Helper: generate sequential student ID ─────────── */
async function generateStudentId(): Promise<string> {
  const year = new Date().getFullYear()
  const supabase = await createClient()
  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .then((r) => ({ count: r.count ?? 0 }))
  return `STU-${year}-${String(count + 1).padStart(4, '0')}`
}



/* ─────────────────────────────────────────────────────
   APPROVE REGISTRATION
   Full workflow:
   1. Validate admin
   2. Fetch pending registration
   3. Ensure student auth account exists (created via OTP) → update profile
   4. Insert student row (with admin-chosen class)
   5. Check parent email in auth.users — if absent, create + send invite
   6. Upsert parent profile
   7. Get / create parent row
   8. Link student ↔ parent in junction table
   9. Mark registration 'approved'
───────────────────────────────────────────────────── */
async function getAuthUserIdByEmail(email: string): Promise<string | null> {
  try {
    let page = 1
    let hasMore = true
    while (hasMore) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !data.users || data.users.length === 0) break
      const user = data.users.find(u => u.email === email)
      if (user) return user.id
      if (data.users.length < 1000) hasMore = false
      page++
    }
  } catch (err) {
    console.error('Error finding user by email:', err)
  }
  return null
}

/* ─────────────────────────────────────────────────────
   APPROVE REGISTRATION
   1. Fetch registration from pending_registrations
   2. Get / create student Auth account
   3. Upsert student profile
   4. Create student row
   5. Get / create parent Auth account
   6. Upsert parent profile
   7. Get / create parent row
   8. Link student ↔ parent in junction table
   9. Mark registration 'approved'
───────────────────────────────────────────────────── */
export async function approveRegistration(
  registrationId: string,
  classId: string
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }
    const adminUser = { id: auth.profile.id }

    /* 1. Fetch the pending registration */
    const { data: reg, error: regErr } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('id', registrationId)
      .eq('status', 'pending')
      .single()

    if (regErr || !reg) {
      return { success: false, error: 'Registration not found or already processed.' }
    }

    /* 2. Find student's existing auth account (created during OTP verification) */
    const existingStudentId = await getAuthUserIdByEmail(reg.student_email)

    let studentAuthId: string

    if (existingStudentId) {
      studentAuthId = existingStudentId
    } else {
      /* Fallback: create account if OTP step somehow didn't fire */
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: reg.student_email,
        email_confirm: true,
        user_metadata: { full_name: reg.student_name, role: 'student' },
      })
      if (createErr || !created.user) {
        return { success: false, error: `Student account creation failed: ${createErr?.message}` }
      }
      studentAuthId = created.user.id
    }

    /* 3. Upsert student profile with full details */
    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
      id: studentAuthId,
      full_name: reg.student_name,
      role: 'student',
      dob: reg.student_dob ?? null,
      address: reg.address ?? null,
      mobile: reg.student_mobile ?? null,
    })
    if (profileErr) {
      return { success: false, error: `Profile update failed: ${profileErr.message}` }
    }

    /* 4. Insert student row */
    const studentId = await generateStudentId()
    const { data: studentRow, error: studentErr } = await supabaseAdmin
      .from('students')
      .upsert(
        {
          profile_id: studentAuthId,
          class_id: classId,
          student_id: studentId,
          father_name: reg.father_name ?? null,
          mother_name: reg.mother_name ?? null,
          admission_date: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'profile_id' }
      )
      .select('id')
      .single()

    if (studentErr || !studentRow) {
      return { success: false, error: `Student record insert failed: ${studentErr?.message}` }
    }

    /* 5. Check if parent already has an auth account */
    const existingParentId = await getAuthUserIdByEmail(reg.parent_email)

    let parentAuthId: string

    if (existingParentId) {
      /* Parent exists — just use their existing account */
      parentAuthId = existingParentId
    } else {
      /* Parent doesn't exist — create account with auto-generated password and send email */
      const generatedPassword = randomBytes(12).toString('base64url').slice(0, 16) + 'A1!'
      const parentName = `${reg.father_name ?? ''} ${reg.mother_name ? '& ' + reg.mother_name : ''}`.trim() || 'Parent'
      
      const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: reg.parent_email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: parentName,
          role: 'parent',
        },
      })
      
      if (createErr || !createdUser.user) {
        return { success: false, error: `Parent account creation failed: ${createErr?.message}` }
      }
      parentAuthId = createdUser.user.id

      // Send the credentials via email
      await sendParentCredentials(
        reg.parent_email,
        parentName,
        reg.student_name,
        generatedPassword
      )
    }

    /* 6. Upsert parent profile */
    await supabaseAdmin.from('profiles').upsert({
      id: parentAuthId,
      full_name: `${reg.father_name ?? ''} & ${reg.mother_name ?? ''}`.trim(),
      role: 'parent',
      mobile: reg.parent_mobile ?? null,
    })

    /* 7. Get or create parent row */
    const { data: existingParentRow } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('profile_id', parentAuthId)
      .maybeSingle()

    let parentRowId: string

    if (existingParentRow?.id) {
      parentRowId = existingParentRow.id
    } else {
      const { data: newParentRow, error: parentErr } = await supabaseAdmin
        .from('parents')
        .insert({ profile_id: parentAuthId })
        .select('id')
        .single()

      if (parentErr || !newParentRow) {
        return { success: false, error: `Parent record insert failed: ${parentErr?.message}` }
      }
      parentRowId = newParentRow.id
    }

    /* 8. Link student ↔ parent in junction table */
    await supabaseAdmin.from('parent_students').upsert(
      { parent_id: parentRowId, student_id: studentRow.id, relation: 'guardian' },
      { onConflict: 'parent_id,student_id' }
    )

    /* 9. Mark registration as approved */
    const { error: updateErr } = await supabaseAdmin
      .from('pending_registrations')
      .update({
        status: 'approved',
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', registrationId)

    if (updateErr) {
      return { success: false, error: `Status update failed: ${updateErr.message}` }
    }

    revalidatePath('/admin/requests')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[approveRegistration]', msg)
    return { success: false, error: msg }
  }
}

/* ─────────────────────────────────────────────────────
   REJECT REGISTRATION
───────────────────────────────────────────────────── */
export async function rejectRegistration(
  registrationId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { success: false, error: auth.error }
    const adminUser = { id: auth.profile.id }

    const supabase = await createClient()
    const { error } = await supabase
      .from('pending_registrations')
      .update({
        status: 'rejected',
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: reason.trim() || 'Rejected by admin.',
      })
      .eq('id', registrationId)
      .eq('status', 'pending')

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/requests')
    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    return { success: false, error: msg }
  }
}

/* ─────────────────────────────────────────────────────
   FETCH DASHBOARD STATS  (used by the admin home page)
───────────────────────────────────────────────────── */
export async function fetchAdminStats() {
  const auth = await requireAdmin()
  if (!auth.ok) return { students: 0, teachers: 0, parents: 0, pending: 0 }

  const supabase = await createClient()
  const [students, teachers, parents, pending] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('teachers').select('id', { count: 'exact', head: true }),
    supabase.from('parents').select('id', { count: 'exact', head: true }),
    supabase
      .from('pending_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  return {
    students: students.count ?? 0,
    teachers: teachers.count ?? 0,
    parents: parents.count ?? 0,
    pending: pending.count ?? 0,
  }
}

/* ─────────────────────────────────────────────────────
   FETCH CLASSES  (for approval modal selector)
───────────────────────────────────────────────────── */
export async function fetchClasses() {
  const auth = await requireAdmin()
  if (!auth.ok) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select('id, class_name, section')
    .order('class_name')
    .order('section')

  if (error) return []
  return data
}
