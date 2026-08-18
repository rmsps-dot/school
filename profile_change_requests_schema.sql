-- =======================================================
-- Profile Change Requests Schema
-- =======================================================

create table if not exists public.profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('student', 'teacher', 'parent')),
  class_id uuid references public.classes(id) on delete set null,
  target_approver text not null check (target_approver in ('teacher', 'admin')),
  current_data jsonb not null,
  requested_data jsonb not null,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  review_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profile_change_requests enable row level security;

-- Policies
drop policy if exists "profile_change_requests: admin full access" on public.profile_change_requests;
create policy "profile_change_requests: admin full access"
  on public.profile_change_requests for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "profile_change_requests: user own access" on public.profile_change_requests;
create policy "profile_change_requests: user own access"
  on public.profile_change_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "profile_change_requests: teacher class access" on public.profile_change_requests;
create policy "profile_change_requests: teacher class access"
  on public.profile_change_requests for all
  using (
    public.auth_role() = 'teacher'
    and class_id in (
      select class_id from public.teacher_classes
      where teacher_id = (select id from public.teachers where profile_id = auth.uid())
    )
  );
