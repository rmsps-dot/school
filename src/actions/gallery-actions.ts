'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/* ════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */

export type GalleryCategory = 'Event' | 'Sports' | 'Campus' | 'Other'
export type GalleryMediaType = 'photo' | 'video'

export interface GalleryItem {
  id: string
  title: string
  category: GalleryCategory
  media_type: GalleryMediaType
  media_url: string
  created_by: string
  created_at: string
}

import { requireAdmin } from '@/utils/auth-helpers'

/* ════════════════════════════════════════════════════════════
   ACTIONS
════════════════════════════════════════════════════════════ */

/**
 * Fetch all gallery items. Read-only access is available to all authenticated users via RLS.
 */
export async function fetchGalleryItems(): Promise<{ data: GalleryItem[]; error?: string }> {
  try {
    const client = await createClient()
    const { data, error } = await client
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return { data: data as GalleryItem[] }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Add a new gallery item using an external URL. Requires Admin role.
 */
export async function addGalleryItem(
  title: string,
  category: GalleryCategory,
  media_type: GalleryMediaType,
  media_url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) throw new Error(auth.error)
    const adminId = auth.profile.id

    if (!title.trim() || !media_url.trim()) {
      throw new Error('Title and Media URL are required.')
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('gallery')
      .insert({
        title: title.trim(),
        category,
        media_type,
        media_url: media_url.trim(),
        created_by: adminId,
      })

    if (error) throw new Error(error.message)

    revalidatePath('/admin/gallery')
    revalidatePath('/teacher/gallery')
    revalidatePath('/student/gallery')
    revalidatePath('/parent/gallery')

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Delete a gallery item. Requires Admin role.
 */
export async function deleteGalleryItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) throw new Error(auth.error)

    const supabase = await createClient()
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/gallery')
    revalidatePath('/teacher/gallery')
    revalidatePath('/student/gallery')
    revalidatePath('/parent/gallery')

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
