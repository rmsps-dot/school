import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // We allow updating another user's avatar ONLY if the current user is an admin
    let targetUserId = user.id;
    if (userId && userId !== user.id) {
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (currentUserProfile?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized to update other users' }, { status: 403 });
      }
      targetUserId = userId;
    }

    // 3. Prepare ImgBB Upload
    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      console.error('Server Error: IMGBB_API_KEY is not defined in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const imgbbFormData = new FormData();
    imgbbFormData.append('image', file);

    // 4. Send to ImgBB
    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });

    if (!imgbbRes.ok) {
      const errorText = await imgbbRes.text();
      console.error('ImgBB Upload Error:', errorText);
      return NextResponse.json({ error: 'Failed to upload image to host' }, { status: 502 });
    }

    const imgbbData = await imgbbRes.json();
    const liveUrl = imgbbData.data.url; // ImgBB direct URL

    // 5. Update Supabase Profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_photo_url: liveUrl })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Supabase Update Error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // 6. Return Success
    return NextResponse.json({ url: liveUrl }, { status: 200 });

  } catch (error: any) {
    console.error('Avatar Upload Exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
