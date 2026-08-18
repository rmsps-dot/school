import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check Admin Role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can upload gallery photos' }, { status: 403 })
    }

    // 3. Parse FormData
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const title = (formData.get('title') as string | null)?.trim() || 'School Event'
    const category = (formData.get('category') as string | null) || 'Event'

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid file format. Only JPG, PNG, WEBP, and GIF images are supported.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 })
    }

    // 4. Check ImgBB API Key
    const imgbbApiKey = process.env.IMGBB_API_KEY
    if (!imgbbApiKey) {
      return NextResponse.json({ error: 'Server error: IMGBB_API_KEY is not configured' }, { status: 500 })
    }

    // 5. Send to ImgBB
    const imgbbFormData = new FormData()
    imgbbFormData.append('image', file)

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    })

    if (!imgbbRes.ok) {
      const errorText = await imgbbRes.text()
      console.error('ImgBB Gallery Upload Error:', errorText)
      return NextResponse.json({ error: 'Failed to upload photo to image CDN' }, { status: 502 })
    }

    const imgbbData = await imgbbRes.json()
    const liveUrl = imgbbData.data.url

    // 6. Insert record into Supabase gallery table
    const validCategory = ['Event', 'Sports', 'Campus', 'Other'].includes(category)
      ? (category as 'Event' | 'Sports' | 'Campus' | 'Other')
      : 'Event'

    const { data: newGalleryItem, error: insertError } = await supabase
      .from('gallery')
      .insert({
        title,
        category: validCategory,
        media_type: 'photo',
        media_url: liveUrl,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Supabase Gallery Insert Error:', insertError)
      return NextResponse.json({ error: insertError.message || 'Failed to save gallery item' }, { status: 500 })
    }

    // 7. Revalidate cached routes
    revalidatePath('/admin/gallery')
    revalidatePath('/teacher/gallery')
    revalidatePath('/student/gallery')
    revalidatePath('/parent/gallery')
    revalidatePath('/')

    return NextResponse.json({ success: true, item: newGalleryItem }, { status: 200 })
  } catch (error: unknown) {
    console.error('Gallery upload error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to upload gallery image' }, { status: 500 })
  }
}
