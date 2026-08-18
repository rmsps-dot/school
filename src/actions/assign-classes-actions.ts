'use server'

import { supabaseAdmin } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/utils/auth-helpers'

export async function getAssignClassesData() {
  const auth = await requireAdmin()
  if (!auth.ok) return { error: auth.error }

  // Fetch all teachers
  const { data: teachers, error: teachersError } = await supabaseAdmin
    .from('teachers')
    .select(`
      id,
      profile_id,
      profiles ( full_name ),
      teacher_classes ( class_id, subject )
    `)
    .order('created_at', { ascending: false })

  if (teachersError) return { error: teachersError.message }

  // Fetch all users to get their emails (requires admin client for auth.users)
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
  if (authError) return { error: authError.message }
  
  const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]))

  // Fetch all classes
  const { data: classes, error: classesError } = await supabaseAdmin
    .from('classes')
    .select('id, class_name, section')
    .order('class_name', { ascending: true })
    .order('section', { ascending: true })

  if (classesError) return { error: classesError.message }

  // Format data
  const formattedTeachers = teachers.map((t) => {
    const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
    return {
      id: t.id,
      full_name: profile?.full_name || 'Unknown',
      email: emailMap.get(t.profile_id) || 'N/A',
      assignedClassIds: t.teacher_classes.map(tc => tc.class_id)
    }
  })

  return { teachers: formattedTeachers, classes, error: null }
}

export async function updateTeacherClasses(teacherId: string, classIds: string[]) {
  const auth = await requireAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

  // 1. Fetch existing assignments so we can diff them
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('teacher_classes')
    .select('class_id')
    .eq('teacher_id', teacherId)

  if (fetchError) return { success: false, error: fetchError.message }

  const existingClassIds = new Set((existing ?? []).map((r) => r.class_id))
  const desiredClassIds  = new Set(classIds)

  // 2. Remove only the class IDs that were de-selected
  const toRemove = [...existingClassIds].filter((id) => !desiredClassIds.has(id))
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from('teacher_classes')
      .delete()
      .eq('teacher_id', teacherId)
      .in('class_id', toRemove)

    if (deleteError) return { success: false, error: deleteError.message }
  }

  // 3. Insert only the newly added class IDs — preserve subject on existing rows
  const toAdd = [...desiredClassIds].filter((id) => !existingClassIds.has(id))
  if (toAdd.length > 0) {
    const inserts = toAdd.map((cid) => ({
      teacher_id: teacherId,
      class_id:   cid,
      subject:    'General', // default for new assignments; admin can update via subject management
    }))

    const { error: insertError } = await supabaseAdmin
      .from('teacher_classes')
      .insert(inserts)

    if (insertError) return { success: false, error: insertError.message }
  }

  revalidatePath('/admin/teachers')
  revalidatePath('/teacher')
  return { success: true }
}
