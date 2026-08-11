'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireAdmin } from '@/utils/auth-helpers'

/* ════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */

export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type LeaveRole = 'student' | 'teacher'

export interface LeaveRequest {
  id: string
  user_id: string
  role: LeaveRole
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  created_at: string
  profiles?: {
    full_name: string
  }
}



/* ════════════════════════════════════════════════════════════
   ACTIONS
════════════════════════════════════════════════════════════ */

/**
 * Apply for leave. Automatically assigns the role from the profile.
 */
export async function applyForLeave(
  startDate: string,
  endDate: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAuth(); if (!auth.ok) throw new Error(auth.error); const userId = auth.profile.id; const role = auth.profile.role as LeaveRole

    if (!startDate || !endDate || !reason.trim()) {
      throw new Error('All fields are required.')
    }

    if (new Date(endDate) < new Date(startDate)) {
      throw new Error('End date cannot be before start date.')
    }

    const client = await createClient()
    const { error } = await client
      .from('leave_requests')
      .insert({
        user_id: userId,
        role: role,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim()
      })

    if (error) throw new Error(error.message)

    revalidatePath(`/${role}/leave`)

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Fetch the current user's leave requests.
 */
export async function fetchMyLeaves(): Promise<{ data: LeaveRequest[]; error?: string }> {
  try {
    const auth = await requireAuth(); if (!auth.ok) throw new Error(auth.error);
    const client = await createClient()
    const { data, error } = await client
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return { data: data as LeaveRequest[] }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Admin: Fetch all pending leave requests.
 */
export async function fetchAllPendingLeaves(): Promise<{ data: LeaveRequest[]; error?: string }> {
  try {
    const auth = await requireAdmin(); if (!auth.ok) throw new Error(auth.error)

    // Using supabaseAdmin here to bypass RLS since we already verified admin
    // Or we could use client if the RLS allows Admin FULL access (which it does).
    const client = await createClient()
    const { data, error } = await client
      .from('leave_requests')
      .select('id, user_id, role, start_date, end_date, reason, status, created_at, profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    const formattedData: LeaveRequest[] = (data || []).map((row: {
      id: string
      user_id: string
      role: LeaveRole
      start_date: string
      end_date: string
      reason: string
      status: LeaveStatus
      created_at: string
      profiles: { full_name: string }[] | { full_name: string } | null
    }) => {
      const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      return {
        id: row.id,
        user_id: row.user_id,
        role: row.role,
        start_date: row.start_date,
        end_date: row.end_date,
        reason: row.reason,
        status: row.status,
        created_at: row.created_at,
        profiles: profileData ? { full_name: profileData.full_name } : undefined
      }
    })

    return { data: formattedData }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Admin: Update leave request status.
 */
export async function updateLeaveStatus(
  id: string,
  status: LeaveStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdmin(); if (!auth.ok) throw new Error(auth.error)

    const supabase = await createClient()
    const { error } = await supabase
      .from('leave_requests')
      .update({ status })
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/leaves')

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
