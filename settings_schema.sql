create table if not exists public.settings (
    key text primary key,
    value jsonb not null,
    description text,
    updated_at timestamptz default now()
);

alter table public.settings enable row level security;

drop policy if exists "Settings are viewable by everyone" on public.settings;
create policy "Settings are viewable by everyone" on public.settings
    for select using (true);

drop policy if exists "Only admins can update settings" on public.settings;
create policy "Only admins can update settings" on public.settings
    for all using (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
      )
    );

insert into public.settings (key, value, description)
values (
  'teacher_attendance_window',
  '{"start": "06:00", "end": "12:00"}',
  'Time window during which teachers can mark class attendance'
) on conflict (key) do nothing;
