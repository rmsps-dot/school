-- =================================================================================
-- SMART LEAVE MANAGEMENT SYSTEM SCHEMA
-- =================================================================================

-- 1. Create Enums
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create the Leave Requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        text          NOT NULL CHECK (role IN ('student', 'teacher')),
  start_date  date          NOT NULL,
  end_date    date          NOT NULL,
  reason      text          NOT NULL,
  status      leave_status  NOT NULL DEFAULT 'pending',
  created_at  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 3. Enable Row Level Security
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Admins have FULL access
CREATE POLICY "leave_requests: admin full access"
  ON public.leave_requests
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can insert their own leave requests
CREATE POLICY "leave_requests: user insert own"
  ON public.leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own leave requests
CREATE POLICY "leave_requests: user read own"
  ON public.leave_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own pending leave requests (optional safety measure)
CREATE POLICY "leave_requests: user delete own pending"
  ON public.leave_requests
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- 5. Indexes for faster querying
CREATE INDEX idx_leave_requests_user_id ON public.leave_requests (user_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests (status);
CREATE INDEX idx_leave_requests_created_at ON public.leave_requests (created_at DESC);
