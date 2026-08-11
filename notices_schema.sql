-- =================================================================================
-- NOTICE BOARD SCHEMA UPDATE
-- Replaces existing `notices` table with a strictly structured one for Task 10
-- =================================================================================

-- 1. Drop existing objects if they exist
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TYPE IF EXISTS notice_target CASCADE;

-- 2. Create the target_role enum
CREATE TYPE notice_target AS ENUM ('all', 'teacher', 'student', 'parent');

-- 3. Create the new notices table
CREATE TABLE public.notices (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text          NOT NULL,
  content     text          NOT NULL,
  target_role notice_target NOT NULL DEFAULT 'all',
  created_by  uuid          REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Admins have FULL CRUD access to the notices table
CREATE POLICY "Admin Full CRUD on Notices"
  ON public.notices
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- All authenticated users can read notices targeted at 'all' or their specific role
CREATE POLICY "Users Read Targeted Notices"
  ON public.notices
  FOR SELECT
  TO authenticated
  USING (
    target_role::text = 'all' OR
    target_role::text = public.auth_role()::text
  );

-- 6. Indexes for performance
CREATE INDEX idx_notices_target_role ON public.notices (target_role);
CREATE INDEX idx_notices_created_at ON public.notices (created_at DESC);
