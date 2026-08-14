import { createClient } from './supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export type AuthResult<T = unknown> = 
  | { ok: true; profile: { id: string; role: string; full_name?: string | null; mobile?: string | null; address?: string | null; dob?: string | null; profile_photo_url?: string | null; [key: string]: unknown }; data?: T }
  | { ok: false; error: string }

/**
 * 1. Base Auth Helper
 * Simply ensures the user is logged in and returns their profile.
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) redirect('/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) redirect('/login')

    return { ok: true, profile }
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'NEXT_REDIRECT') throw err;
      return { ok: false, error: err.message || 'Authentication failed' }
    }
    return { ok: false, error: 'Authentication failed' }
  }
}

/**
 * 2. Role-Only Helpers
 */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.profile.role !== 'admin') return { ok: false, error: 'Forbidden: Admin only' }
  return auth
}

export async function requireTeacher(): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.profile.role !== 'teacher') return { ok: false, error: 'Forbidden: Teacher only' }
  return auth
}

export async function requireStudent(): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.profile.role !== 'student') return { ok: false, error: 'Forbidden: Student only' }
  return auth
}

export async function requireParent(): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!auth.ok) return auth
  if (auth.profile.role !== 'parent') return { ok: false, error: 'Forbidden: Parent only' }
  return auth
}

/**
 * 3. Ownership-Scoped Helpers
 */

interface OwnershipOptions {
  allowAdmin?: boolean;
  allowTeacher?: boolean;
}

/**
 * Verifies if the user is a teacher assigned to the given classId.
 * Supports bypassing for Admins via options.
 */
export async function requireTeacherForClass(
  classId: string, 
  options: OwnershipOptions = { allowAdmin: true }
): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!auth.ok) return auth

  // Admin bypass
  if (options.allowAdmin && auth.profile.role === 'admin') {
    return auth
  }

  // Must be teacher if not admin
  if (auth.profile.role !== 'teacher') {
    return { ok: false, error: 'Forbidden: You must be a teacher assigned to this class' }
  }

  const supabase = await createClient()
  
  // Find teacher ID
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('profile_id', auth.profile.id)
    .single()

  if (!teacher) return { ok: false, error: 'Teacher profile not found' }

  // Verify class assignment
  const { data: assignment } = await supabase
    .from('teacher_classes')
    .select('class_id')
    .eq('teacher_id', teacher.id)
    .eq('class_id', classId)
    .single()

  if (!assignment) {
    return { ok: false, error: 'Forbidden: You do not own this class' }
  }

  return auth
}

/**
 * Verifies if the user is the student themselves, or the student's guardian.
 * Supports bypassing for Admins or Teachers via options.
 */
export async function requireSelfOrGuardianOf(
  studentId: string,
  options: OwnershipOptions = { allowAdmin: true, allowTeacher: true }
): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!auth.ok) return auth

  const role = auth.profile.role

  // Admin / Teacher bypass
  if (options.allowAdmin && role === 'admin') return auth
  if (options.allowTeacher && role === 'teacher') return auth

  const supabase = await createClient()

  if (role === 'student') {
    // Check if the caller is the student themselves
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', auth.profile.id)
      .single()
      
    if (!student || student.id !== studentId) {
      return { ok: false, error: 'Forbidden: You can only access your own records' }
    }
    return auth
  }

  if (role === 'parent') {
    // Check if the caller is a parent of this student
    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('profile_id', auth.profile.id)
      .single()

    if (!parent) return { ok: false, error: 'Parent profile not found' }

    const { data: mapping } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', parent.id)
      .eq('student_id', studentId)
      .single()

    if (!mapping) {
      return { ok: false, error: 'Forbidden: You are not a guardian of this student' }
    }
    return auth
  }

  return { ok: false, error: 'Forbidden: Access denied' }
}
