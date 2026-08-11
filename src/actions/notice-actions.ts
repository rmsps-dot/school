'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireTeacher, requireAuth, requireAdmin } from '@/utils/auth-helpers'

/* ════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */

export type TargetRole = 'all' | 'teacher' | 'student' | 'parent'

export interface Notice {
  id: string
  title: string
  content: string
  target_role: TargetRole
  created_by: string
  created_at: string
}

/* ════════════════════════════════════════════════════════════
   SERVER ACTIONS
════════════════════════════════════════════════════════════ */

/**
 * Fetch notices securely. RLS handles the filtering automatically based on the caller's role.
 * Admins see all. Students see 'all' + 'student'. Teachers see 'all' + 'teacher'. etc.
 */
export async function fetchNotices(): Promise<{ data: Notice[]; error?: string }> {
  try {
    const client = await createClient()
    const { data, error } = await client
      .from('notices')
      .select('id, title, content, target_role, created_by, created_at')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return { data: data as Notice[] }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Create a new notice. Requires Admin role.
 */
export async function createNotice(
  title: string,
  content: string,
  target_role: TargetRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdmin(); if (!auth.ok) throw new Error(auth.error); const adminId = auth.profile.id

    if (!title.trim() || !content.trim()) {
      throw new Error('Title and Content are required.')
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('notices')
      .insert({
        title: title.trim(),
        content: content.trim(),
        target_role,
        created_by: adminId,
      })

    if (error) throw new Error(error.message)

    revalidatePath('/admin/notices')
    revalidatePath('/teacher/notices')
    revalidatePath('/student/notices')
    revalidatePath('/parent/notices')

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Update an existing notice. Requires Admin role.
 */
export async function updateNotice(
  id: string,
  title: string,
  content: string,
  target_role: TargetRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdmin(); if (!auth.ok) throw new Error(auth.error)

    if (!title.trim() || !content.trim()) {
      throw new Error('Title and Content are required.')
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('notices')
      .update({
        title: title.trim(),
        content: content.trim(),
        target_role,
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/notices')
    revalidatePath('/teacher/notices')
    revalidatePath('/student/notices')
    revalidatePath('/parent/notices')

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Delete a notice. Requires Admin role.
 */
export async function deleteNotice(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdmin(); if (!auth.ok) throw new Error(auth.error)

    const supabase = await createClient()
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/notices')
    revalidatePath('/teacher/notices')
    revalidatePath('/student/notices')
    revalidatePath('/parent/notices')

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
