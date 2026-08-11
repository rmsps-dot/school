'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireTeacher } from '@/utils/auth-helpers'

/* ════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */

export interface Homework {
  id: string
  class_id: string
  subject: string
  title: string
  description: string
  due_date: string
  created_by: string
  created_at: string
  class_info?: {
    class_name: string
    section: string
  }
  teacher_info?: {
    full_name: string
  }
}

export interface ClassOption {
  id: string
  class_name: string
  section: string
}

/* ════════════════════════════════════════════════════════════
   ACTIONS
════════════════════════════════════════════════════════════ */

/**
 * Fetch classes assigned to the current teacher.
 */
export async function fetchTeacherClasses(): Promise<{ data: ClassOption[]; error?: string }> {
  try {
    const auth = await requireTeacher(); if (!auth.ok) throw new Error(auth.error); const teacherId = auth.profile.id

    const supabase = await createClient()

    // Find the teacher's profile first to get the teacher row ID
    let { data: teacherRecord } = await supabase
      .from('teachers')
      .select('id')
      .eq('profile_id', teacherId)
      .maybeSingle()

    if (!teacherRecord) {
      throw new Error(
        'Your teacher profile is incomplete. No teacher record found — contact admin to set up your account.'
      )
    }

    const { data, error } = await supabase
      .from('teacher_classes')
      .select('class_id, classes(class_name, section)')
      .eq('teacher_id', teacherRecord.id)

    if (error) throw new Error(error.message)

    // Deduplicate classes (a teacher might teach multiple subjects in the same class)
    const classMap = new Map<string, ClassOption>()
    for (const row of (data || [])) {
      const cls = row.classes as unknown as { class_name: string; section: string } | null
      if (cls && !classMap.has(row.class_id)) {
        classMap.set(row.class_id, {
          id: row.class_id,
          class_name: cls.class_name,
          section: cls.section
        })
      }
    }

    return { data: Array.from(classMap.values()) }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Create a new homework entry.
 */
export async function createHomework(
  class_id: string,
  subject: string,
  title: string,
  description: string,
  due_date: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireTeacher(); if (!auth.ok) throw new Error(auth.error); const profileId = auth.profile.id

    if (!class_id || !subject.trim() || !title.trim() || !description.trim() || !due_date) {
      throw new Error('All fields are required.')
    }

    const client = await createClient()
    const { error } = await client
      .from('homework')
      .insert({
        class_id,
        subject: subject.trim(),
        title: title.trim(),
        description: description.trim(),
        due_date,
        created_by: profileId
      })

    if (error) throw new Error(error.message)

    revalidatePath('/teacher/homework')
    revalidatePath('/student/homework')
    revalidatePath('/parent/homework')

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Fetch homework for a specific class (or all assigned classes for a teacher)
 * strictly limited to the past 7 days.
 */
export async function fetchRecentHomework(classId?: string): Promise<{ data: Homework[]; error?: string }> {
  try {
    const client = await createClient()
    
    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const cutoffDate = sevenDaysAgo.toISOString()

    let query = client
      .from('homework')
      .select(`
        id, class_id, subject, title, description, due_date, created_at, created_by,
        classes (class_name, section),
        profiles:created_by (full_name)
      `)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false })

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)

    const formattedData: Homework[] = (data || []).map((row) => {
      const cls = row.classes as unknown as { class_name: string; section: string } | null
      const prof = row.profiles as unknown as { full_name: string } | null
      return {
        id: row.id,
        class_id: row.class_id,
        subject: row.subject,
        title: row.title,
        description: row.description,
        due_date: row.due_date,
        created_by: row.created_by,
        created_at: row.created_at,
        class_info: cls ? { class_name: cls.class_name, section: cls.section } : undefined,
        teacher_info: prof ? { full_name: prof.full_name } : undefined
      }
    })

    return { data: formattedData }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
