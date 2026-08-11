-- -------------------------------------------------------
-- 11. STUDENT FEES
-- -------------------------------------------------------

create table if not exists public.student_fees (
  id          uuid primary key default gen_random_uuid(),
  student_id  text not null references public.students(student_id) on delete cascade,
  fee_name    text not null, -- e.g., 'Tuition Fee', 'Exam Fee'
  amount      numeric(10,2) not null default 0,
  paid_amount numeric(10,2) not null default 0,
  due_date    date not null,
  status      text not null check (status in ('paid', 'due', 'upcoming')) default 'due',
  created_at  timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.student_fees enable row level security;

-- Policies
create policy "student_fees: admin full access"
  on public.student_fees for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "student_fees: parent reads own children"
  on public.student_fees for select
  using (
    public.auth_role() = 'parent'
    and student_id in (
      select s.student_id 
      from public.students s
      join public.parent_students ps on ps.student_id = s.id
      where ps.parent_id = (select id from public.parents where profile_id = auth.uid())
    )
  );

create policy "student_fees: student reads own fees"
  on public.student_fees for select
  using (
    public.auth_role() = 'student'
    and student_id = (select student_id from public.students where profile_id = auth.uid())
  );

-- Sample Data (Optional, for testing)
-- INSERT INTO public.student_fees (student_id, fee_name, amount, paid_amount, due_date, status)
-- VALUES ('STU001', 'Tuition Fee Q1', 4000, 4000, '2026-04-10', 'paid');
