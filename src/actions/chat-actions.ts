'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { requireAuth, requireAdmin } from '@/utils/auth-helpers'
import type { Database } from '@/types/supabase'

/* ════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */

export interface ChatContact {
  id: string
  full_name: string
  role: string
  extraInfo?: string
}

export type ChatMessage = Database['public']['Tables']['messages']['Row']

/* ════════════════════════════════════════════════════════════
   ACTIONS
════════════════════════════════════════════════════════════ */

/**
 * Hard Delete Conversation
 * Permanently deletes all messages between the authenticated user and the selected user.
 */
export async function deleteConversation(otherUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return { success: false, error: auth.error }
    const myId = auth.profile.id

    const client = await createClient()
    
    // Delete messages where (sender=me AND receiver=other) OR (sender=other AND receiver=me)
    const { error } = await client
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myId})`)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('deleteConversation error:', err)
    return { success: false, error: err.message || 'Failed to delete conversation' }
  }
}


/**
 * Action 1: Get contacts for Teacher panel
 * Uses role tab ('teachers', 'students', 'parents', 'admin') and optional classId.
 */
export async function getContactsForTeacher(tab: string, classId?: string): Promise<{ data: ChatContact[]; error?: string }> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return { data: [], error: auth.error }
    if (auth.profile.role !== 'teacher' && auth.profile.role !== 'admin') {
      return { data: [], error: 'Forbidden: Admin or Teacher only' }
    }
    const client = await createClient()

    // Teachers/Admins list: use Admin client to bypass RLS (teachers can't read other staff profiles by default)
    if (tab === 'teachers' || tab === 'admin') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', tab === 'teachers' ? 'teacher' : 'admin')
        .eq('is_active', true)
        .neq('id', auth.profile.id)
        .order('full_name', { ascending: true })

      if (error) throw error
      return { data: data as ChatContact[] }
    } 
    
    if (tab === 'students') {
      if (!classId) return { data: [] }
      
      const { data, error } = await client
        .from('students')
        .select('profile_id, profiles!students_profile_id_fkey(full_name, role)')
        .eq('class_id', classId)

      if (error) throw error
      
      const formatted = (data || []).map((row) => {
        const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return {
          id: row.profile_id,
          full_name: prof?.full_name || 'Unknown',
          role: 'student' as const
        }
      }).sort((a, b) => a.full_name.localeCompare(b.full_name))

      return { data: formatted }
    }

    if (tab === 'parents') {
      if (!classId) return { data: [] }
      
      // Get all students in this class
      const { data: students, error: studErr } = await client
        .from('students')
        .select('id, student_id, profiles!students_profile_id_fkey(full_name)')
        .eq('class_id', classId)
        
      if (studErr) throw studErr
      if (!students || students.length === 0) return { data: [] }
      
      const studentUuids = students.map(s => s.id)
      
      // Find parents linked to these students
      const { data: parentLinks, error: parentErr } = await client
        .from('parent_students')
        .select('parent_id, student_id')
        .in('student_id', studentUuids)
        
      if (parentErr) throw parentErr
      if (!parentLinks || parentLinks.length === 0) return { data: [] }
      
      const parentIds = [...new Set(parentLinks.map(p => p.parent_id))]
      
      // Fetch parent profiles
      const { data: parents, error: profileErr } = await client
        .from('parents')
        .select('id, profile_id, profiles!parents_profile_id_fkey(full_name, role)')
        .in('id', parentIds)
        
      if (profileErr) throw profileErr
      
      const formatted = (parents || [])
        .map(parent => {
          const prof = Array.isArray(parent.profiles) ? parent.profiles[0] : parent.profiles
          if (!prof) return null
          
          // Find which students this parent is linked to in this class
          const linkedStudentIds = parentLinks.filter(pl => pl.parent_id === parent.id).map(pl => pl.student_id)
          const linkedStudentNames = students
            .filter(s => linkedStudentIds.includes(s.student_id))
            .map(s => {
              const sprof = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
              return sprof?.full_name || 'Unknown'
            })
            .join(', ')
            
          return {
            id: parent.profile_id,
            full_name: prof.full_name,
            role: 'parent' as const,
            extraInfo: `Parent of: ${linkedStudentNames}`
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
      
      return { data: formatted }
    }

    return { data: [] }
  } catch (err: any) {
    return { data: [], error: err?.message || 'Unknown error' }
  }
}

/**
 * Get contacts for Student/Parent panels
 * Shows all Teachers, but only shows Admins if there is an existing chat history.
 */
export async function getStaffContacts(): Promise<{ data: ChatContact[]; error?: string }> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return { data: [], error: auth.error }
    const userId = auth.profile.id
    const client = await createClient()
    
    // Fetch all teachers using Admin client to bypass RLS (students can't read teacher profiles by default)
    const { data: teachers, error: tErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'teacher')
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (tErr) throw tErr

    // Find admins with chat history with this user
    const { data: msgs, error: mErr } = await client
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    if (mErr) throw mErr

    const interactors = new Set<string>()
    msgs?.forEach(m => {
      if (m.sender_id !== userId) interactors.add(m.sender_id)
      if (m.receiver_id !== userId) interactors.add(m.receiver_id)
    })

    let admins: ChatContact[] = []
    if (interactors.size > 0) {
      const { data: adminData } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'admin')
        .in('id', Array.from(interactors))
        .eq('is_active', true)
        
      if (adminData) admins = adminData as ChatContact[]
    }

    const combined = [...admins, ...(teachers || [])]
    return { data: combined as ChatContact[] }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Get unread message counts for the current user
 */
export async function getUnreadCounts(): Promise<{ 
  data: { bySender: Record<string, number>, byRole: Record<string, number>, total: number }; 
  error?: string 
}> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) throw new Error(auth.error)
    const userId = auth.profile.id
    const client = await createClient()

    const { data, error } = await client
      .from('messages')
      .select('sender_id, profiles!messages_sender_id_fkey(role)')
      .eq('receiver_id', userId)
      .eq('is_read', false)

    if (error) throw error

    const bySender: { [key: string]: number } = {}
    const byRole: { [key: string]: number } = {}
    let total = 0

    data?.forEach((msg) => {
      bySender[msg.sender_id] = (bySender[msg.sender_id] || 0) + 1
      const prof = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles
      const role = prof?.role || 'unknown'
      byRole[role] = (byRole[role] || 0) + 1
      total++
    })

    return { data: { bySender, byRole, total } }
  } catch (err) {
    return { data: { bySender: {}, byRole: {}, total: 0 }, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Get all profiles for Admin
 */
export async function getAllProfiles(): Promise<{ data: ChatContact[]; error?: string }> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return { data: [], error: auth.error }
    const client = await createClient()
    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, role')
      .eq('is_active', true)
      .order('role', { ascending: true })
      .order('full_name', { ascending: true })

    if (error) throw error
    return { data: data as ChatContact[] }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Action 2: Get message history between current user and recipient
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getMessageHistory(receiverId: string): Promise<{ data: ChatMessage[]; error?: string }> {
  try {
    // Validate receiverId is a proper UUID to prevent raw string injection
    if (!UUID_REGEX.test(receiverId)) return { data: [], error: 'Invalid receiver ID format.' }

    const auth = await requireAuth()
    if (!auth.ok) return { data: [], error: auth.error }
    const userId = auth.profile.id
    const client = await createClient()

    const { data, error } = await client
      .from('messages')
      .select('*')
      .in('sender_id', [userId, receiverId])
      .in('receiver_id', [userId, receiverId])
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mark as read if user is receiver
    const unreadIds = data
      .filter(m => m.receiver_id === userId && !m.is_read)
      .map(m => m.id)

    if (unreadIds.length > 0) {
      // Fire and forget update
      client.from('messages').update({ is_read: true }).in('id', unreadIds).then()
    }

    return { data: data as ChatMessage[] }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Action 3: Send a new message
 */
export async function sendMessageAction(receiverId: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return { success: false, error: auth.error }
    const senderId = auth.profile.id
    
    if (!content.trim()) throw new Error('Message content cannot be empty.')
    if (senderId === receiverId) throw new Error('Cannot send message to yourself.')

    const client = await createClient()
    const { error } = await client
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim()
      })

    if (error) throw error
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
