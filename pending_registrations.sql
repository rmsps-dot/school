-- ============================================================
--  RMSPS — pending_registrations table
--  Run this in Supabase SQL Editor AFTER the main schema.sql
-- ============================================================

create type registration_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.pending_registrations (
  id              uuid                  primary key default uuid_generate_v4(),
  student_name    text                  not null,
  student_dob     date,
  student_email   text                  not null,
  student_mobile  text,
  address         text,
  father_name     text,
  mother_name     text,
  parent_mobile   text,
  parent_email    text,
  status          registration_status   not null default 'pending',
  reviewed_by     uuid                  references public.profiles(id) on delete set null,
  reviewed_at     timestamptz,
  admin_notes     text,
  created_at      timestamptz           not null default now(),
  updated_at      timestamptz           not null default now()
);

create trigger pending_registrations_updated_at
  before update on public.pending_registrations
  for each row execute function public.set_updated_at();

create index if not exists idx_pending_reg_status
  on public.pending_registrations (status, created_at desc);

-- ── Enable RLS ──
alter table public.pending_registrations enable row level security;

-- Anyone (including unauthenticated applicants) can INSERT their own application.
-- Supabase anon key is sufficient here because email OTP has already verified the user.
create policy "pending_reg: anyone can submit"
  on public.pending_registrations for insert
  with check (true);

-- Only admins can read, update (approve/reject), or delete applications.
create policy "pending_reg: admin full access"
  on public.pending_registrations for all
  using (public.is_admin())
  with check (public.is_admin());
