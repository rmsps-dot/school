-- =================================================================================
-- URL-BASED GALLERY SYSTEM SCHEMA
-- =================================================================================

-- 1. Create Enums
CREATE TYPE gallery_category AS ENUM ('Event', 'Sports', 'Campus', 'Other');
CREATE TYPE gallery_media_type AS ENUM ('photo', 'video');

-- 2. Create the Gallery table
CREATE TABLE IF NOT EXISTS public.gallery (
  id          uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text               NOT NULL,
  category    gallery_category   NOT NULL DEFAULT 'Other',
  media_type  gallery_media_type NOT NULL DEFAULT 'photo',
  media_url   text               NOT NULL,
  created_by  uuid               NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz        NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Admins have FULL CRUD access
CREATE POLICY "gallery: admin full access"
  ON public.gallery
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- All authenticated users can read the gallery
CREATE POLICY "gallery: users can read"
  ON public.gallery
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Indexes for fast filtering and sorting
CREATE INDEX idx_gallery_category ON public.gallery (category);
CREATE INDEX idx_gallery_media_type ON public.gallery (media_type);
CREATE INDEX idx_gallery_created_at ON public.gallery (created_at DESC);
