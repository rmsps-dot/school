'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/utils/auth-helpers'

export interface ProfileChangeRequestItem {
  id: string
  user_id: string
  role: 'student' | 'teacher' | 'parent'
  class_id: string | null
  target_approver: 'teacher' | 'admin'
  current_data: Record<string, string | null | undefined>
  requested_data: Record<string, string | null | undefined>
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  profiles?: {
    full_name: string | null
    mobile: string | null
    profile_photo_url: string | null
  } | null
  classes?: {
    id: string
    class_name: string
    section: string
  } | null
}

/**
 * Submit a new profile change request by the authenticated user
 */
export async function submitProfileChangeRequest(payload: {
  role: 'student' | 'teacher' | 'parent'
  current_data: Record<string, string | null | undefined>
  requested_data: Record<string, string | null | undefined>
  class_id?: string | null
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'User is not authenticated.' }
    }

    // Determine target approver: teachers route to admin, students/parents route to class teacher
    const targetApprover: 'teacher' | 'admin' = payload.role === 'teacher' ? 'admin' : 'teacher'

    // Check if user already has an active pending request
    const { data: existing } = await supabaseAdmin
      .from('profile_change_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      // Update existing pending request
      const { error: updateError } = await supabaseAdmin
        .from('profile_change_requests')
        .update({
          current_data: payload.current_data,
          requested_data: payload.requested_data,
          class_id: payload.class_id || null,
          target_approver: targetApprover,
          created_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) return { success: false, error: updateError.message }
    } else {
      // Insert new request
      const { error: insertError } = await supabaseAdmin
        .from('profile_change_requests')
        .insert({
          user_id: user.id,
          role: payload.role,
          class_id: payload.class_id || null,
          target_approver: targetApprover,
          current_data: payload.current_data,
          requested_data: payload.requested_data,
          status: 'pending',
        })

      if (insertError) return { success: false, error: insertError.message }
    }

    revalidatePath('/student')
    revalidatePath('/parent')
    revalidatePath('/teacher/profile')
    revalidatePath('/teacher/students')
    revalidatePath('/admin/requests')

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit profile change request',
    }
  }
}

/**
 * Fetch any pending request for the current user
 */
export async function getUserPendingProfileRequest() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { data: null, error: null }

    const { data, error } = await supabaseAdmin
      .from('profile_change_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    return { data: (data as unknown as ProfileChangeRequestItem) || null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch user pending request' }
  }
}

/**
 * Class teacher fetches pending student/parent profile change requests for their assigned classes
 */
export async function getClassTeacherPendingRequests() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { data: [], error: 'Not authenticated' }

    // 1. Get teacher id
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!teacher) return { data: [], error: 'Teacher record not found' }

    // 2. Get assigned class ids
    const { data: teacherClasses } = await supabaseAdmin
      .from('teacher_classes')
      .select('class_id')
      .eq('teacher_id', teacher.id)

    const classIds = (teacherClasses || []).map((tc) => tc.class_id).filter(Boolean)
    if (classIds.length === 0) return { data: [], error: null }

    // 3. Fetch requests matching classIds
    const { data: requests, error } = await supabaseAdmin
      .from('profile_change_requests')
      .select('id, user_id, role, class_id, target_approver, current_data, requested_data, status, review_notes, reviewed_by, reviewed_at, created_at')
      .in('class_id', classIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    if (!requests || requests.length === 0) return { data: [], error: null }

    // 4. Batch fetch profiles and classes to avoid PostgREST relationship ambiguity
    const userIds = Array.from(new Set(requests.map((r) => r.user_id).filter(Boolean)))
    const reqClassIds = Array.from(new Set(requests.map((r) => r.class_id).filter(Boolean)))

    const [{ data: profileList }, { data: classList }] = await Promise.all([
      userIds.length > 0
        ? supabaseAdmin.from('profiles').select('id, full_name, mobile, profile_photo_url').in('id', userIds)
        : Promise.resolve({ data: [] }),
      reqClassIds.length > 0
        ? supabaseAdmin.from('classes').select('id, class_name, section').in('id', reqClassIds)
        : Promise.resolve({ data: [] }),
    ])

    const profileMap = new Map((profileList || []).map((p) => [p.id, p]))
    const classMap = new Map((classList || []).map((c) => [c.id, c]))

    const formatted: ProfileChangeRequestItem[] = requests.map((r) => {
      const c = r.class_id ? classMap.get(r.class_id) : null
      const prof = profileMap.get(r.user_id)
      return {
        id: r.id,
        user_id: r.user_id,
        role: r.role as 'student' | 'teacher' | 'parent',
        class_id: r.class_id,
        target_approver: r.target_approver as 'teacher' | 'admin',
        current_data: r.current_data as Record<string, string | null | undefined>,
        requested_data: r.requested_data as Record<string, string | null | undefined>,
        status: r.status as 'pending' | 'approved' | 'rejected',
        review_notes: r.review_notes,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        created_at: r.created_at,
        profiles: prof ? {
          full_name: prof.full_name,
          mobile: prof.mobile,
          profile_photo_url: prof.profile_photo_url,
        } : null,
        classes: c || null,
      }
    })

    return { data: formatted, error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch class teacher requests' }
  }
}

/**
 * Admin fetches all profile change requests, optionally filtered by role
 */
export async function getAdminProfileRequests(filterRole?: 'all' | 'student' | 'teacher' | 'parent') {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }

    let query = supabaseAdmin
      .from('profile_change_requests')
      .select('id, user_id, role, class_id, target_approver, current_data, requested_data, status, review_notes, reviewed_by, reviewed_at, created_at')
      .order('created_at', { ascending: false })

    if (filterRole && filterRole !== 'all') {
      query = query.eq('role', filterRole)
    }

    const { data: requests, error } = await query

    if (error) return { data: [], error: error.message }
    if (!requests || requests.length === 0) return { data: [], error: null }

    // Batch fetch profiles and classes
    const userIds = Array.from(new Set(requests.map((r) => r.user_id).filter(Boolean)))
    const classIds = Array.from(new Set(requests.map((r) => r.class_id).filter(Boolean)))

    const [{ data: profileList }, { data: classList }] = await Promise.all([
      userIds.length > 0
        ? supabaseAdmin.from('profiles').select('id, full_name, mobile, profile_photo_url').in('id', userIds)
        : Promise.resolve({ data: [] }),
      classIds.length > 0
        ? supabaseAdmin.from('classes').select('id, class_name, section').in('id', classIds)
        : Promise.resolve({ data: [] }),
    ])

    const profileMap = new Map((profileList || []).map((p) => [p.id, p]))
    const classMap = new Map((classList || []).map((c) => [c.id, c]))

    const formatted: ProfileChangeRequestItem[] = requests.map((r) => {
      const c = r.class_id ? classMap.get(r.class_id) : null
      const prof = profileMap.get(r.user_id)
      return {
        id: r.id,
        user_id: r.user_id,
        role: r.role as 'student' | 'teacher' | 'parent',
        class_id: r.class_id,
        target_approver: r.target_approver as 'teacher' | 'admin',
        current_data: r.current_data as Record<string, string | null | undefined>,
        requested_data: r.requested_data as Record<string, string | null | undefined>,
        status: r.status as 'pending' | 'approved' | 'rejected',
        review_notes: r.review_notes,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        created_at: r.created_at,
        profiles: prof ? {
          full_name: prof.full_name,
          mobile: prof.mobile,
          profile_photo_url: prof.profile_photo_url,
        } : null,
        classes: c || null,
      }
    })

    return { data: formatted, error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch admin profile requests' }
  }
}

/**
 * Approve a profile change request (Teacher or Admin)
 */
export async function approveProfileChangeRequest(requestId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    // 1. Fetch request
    const { data: request, error: fetchErr } = await supabaseAdmin
      .from('profile_change_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchErr || !request) return { success: false, error: 'Request not found' }
    if (request.status !== 'pending') return { success: false, error: 'Request is already processed' }

    const reqData = request.requested_data as Record<string, string | null | undefined>

    // 2. Update profiles table
    const profileUpdates: {
      full_name?: string
      mobile?: string | null
      address?: string | null
      dob?: string | null
    } = {}

    if (typeof reqData.fullName === 'string' && reqData.fullName.trim()) {
      profileUpdates.full_name = reqData.fullName.trim()
    }
    if (typeof reqData.mobile === 'string') {
      profileUpdates.mobile = reqData.mobile.trim() || null
    }
    if (typeof reqData.address === 'string') {
      profileUpdates.address = reqData.address.trim() || null
    }
    if (typeof reqData.dob === 'string') {
      profileUpdates.dob = reqData.dob || null
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: pErr } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', request.user_id)

      if (pErr) return { success: false, error: pErr.message }
    }

    // 3. Update role specific tables
    if (request.role === 'student') {
      const studentUpdates: { father_name?: string | null; mother_name?: string | null } = {}
      if (typeof reqData.fatherName === 'string') studentUpdates.father_name = reqData.fatherName.trim() || null
      if (typeof reqData.motherName === 'string') studentUpdates.mother_name = reqData.motherName.trim() || null

      if (Object.keys(studentUpdates).length > 0) {
        await supabaseAdmin
          .from('students')
          .update(studentUpdates)
          .eq('profile_id', request.user_id)
      }
    } else if (request.role === 'teacher') {
      const teacherUpdates: { qualification?: string } = {}
      if (typeof reqData.qualification === 'string' && reqData.qualification.trim()) {
        teacherUpdates.qualification = reqData.qualification.trim()
      }

      if (Object.keys(teacherUpdates).length > 0) {
        await supabaseAdmin
          .from('teachers')
          .update(teacherUpdates)
          .eq('profile_id', request.user_id)
      }
    }

    // 4. Mark request approved
    const { error: markErr } = await supabaseAdmin
      .from('profile_change_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (markErr) return { success: false, error: markErr.message }

    revalidatePath('/admin/requests')
    revalidatePath('/admin/students')
    revalidatePath('/admin/teachers')
    revalidatePath('/admin/parents')
    revalidatePath('/teacher/students')
    revalidatePath('/teacher/profile')
    revalidatePath('/student')
    revalidatePath('/parent')

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to approve profile change request',
    }
  }
}

/**
 * Reject a profile change request (Teacher or Admin)
 */
export async function rejectProfileChangeRequest(requestId: string, reason?: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabaseAdmin
      .from('profile_change_requests')
      .update({
        status: 'rejected',
        review_notes: reason?.trim() || 'Request rejected by reviewer.',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/requests')
    revalidatePath('/teacher/students')
    revalidatePath('/teacher/profile')
    revalidatePath('/student')
    revalidatePath('/parent')

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reject profile change request',
    }
  }
}
