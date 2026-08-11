-- =================================================================================
-- DAILY HOMEWORK SYSTEM SCHEMA
-- =================================================================================

CREATE TABLE IF NOT EXISTS public.homework (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid        NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject     text        NOT NULL,
  title       text        NOT NULL,
  description text        NOT NULL,
  due_date    date        NOT NULL,
  created_by  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "homework: admin full access"
  ON public.homework
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Teachers can insert/update/delete homework for classes they teach
CREATE POLICY "homework: teacher manage assigned classes"
  ON public.homework
  FOR ALL
  TO authenticated
  USING (
    public.auth_role() = 'teacher' AND
    class_id IN (SELECT public.my_class_ids())
  )
  WITH CHECK (
    public.auth_role() = 'teacher' AND
    class_id IN (SELECT public.my_class_ids())
  );

-- Students can read homework for their own class
CREATE POLICY "homework: student read own class"
  ON public.homework
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'student' AND
    class_id = (SELECT c_id FROM (SELECT class_id as c_id FROM public.students WHERE profile_id = auth.uid()) as subquery)
  );

-- Parents can read homework for any class their children are in
CREATE POLICY "homework: parent read children classes"
  ON public.homework
  FOR SELECT
  TO authenticated
  USING (
    public.auth_role() = 'parent' AND
    class_id IN (SELECT class_id FROM public.students WHERE id IN (SELECT public.my_children_ids()))
  );

-- Indexes for fast querying by class and date (for the 7-day filter)
CREATE INDEX idx_homework_class_date ON public.homework (class_id, created_at DESC);
