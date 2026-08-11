-- ============================================================
--  RMSPS — attendance-photos Storage Bucket
--  Run this in Supabase SQL Editor AFTER the main schema.sql
--  and pending_registrations.sql
-- ============================================================

-- 1. Create the PUBLIC bucket
--    'public = true' means objects are accessible via their URL without auth.
--    Auth is still required for INSERT/UPDATE/DELETE via RLS.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-photos',
  'attendance-photos',
  true,
  5242880,           -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public            = EXCLUDED.public,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;


-- 2. RLS on storage.objects
--    Supabase Storage uses the storage.objects table with RLS.
--    We reference our custom public.profiles table to check role.

-- Allow teachers (and admins) to upload photos
--   Path convention enforced by the app: teachers/{profile_id}/{date}.jpg
CREATE POLICY "teachers_upload_attendance_photo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attendance-photos'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
  )
);

-- Allow teachers to read/view their own photos
CREATE POLICY "teachers_read_own_photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos'
  AND (
    -- Teachers can read their own folder
    (
      (storage.foldername(name))[2] = auth.uid()::text
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'teacher'
      )
    )
    OR
    -- Admins can read everything
    public.is_admin()
  )
);

-- Allow teachers to update/replace their own photo (for re-submission)
CREATE POLICY "teachers_update_own_photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attendance-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  )
)
WITH CHECK (
  bucket_id = 'attendance-photos'
);

-- Only admins can delete photos
CREATE POLICY "admins_delete_attendance_photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attendance-photos'
  AND public.is_admin()
);
