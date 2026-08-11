create table if not exists public.student_attendance (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.students(id) on delete cascade not null,
    class_id uuid references public.classes(id) on delete cascade not null,
    date date not null default current_date,
    status text not null check (status in ('present', 'absent', 'leave')),
    marked_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(student_id, date)
);

alter table public.student_attendance enable row level security;

drop policy if exists "Attendance viewable by everyone" on public.student_attendance;
create policy "Attendance viewable by everyone" on public.student_attendance
    for select using (true);

drop policy if exists "Teachers and Admins can insert/update attendance" on public.student_attendance;
create policy "Teachers and Admins can insert/update attendance" on public.student_attendance
    for all using (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role in ('admin', 'teacher')
      )
    );
