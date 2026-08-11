create table if not exists public.teacher_payments (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    amount numeric(10,2) not null check (amount > 0),
    payment_date date not null default current_date,
    status text not null default 'paid' check (status in ('paid', 'pending', 'failed')),
    remarks text,
    recorded_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.teacher_payments enable row level security;

-- Policies
create policy "Admins can view and manage teacher payments"
on public.teacher_payments
for all
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);

create policy "Teachers can view their own payments"
on public.teacher_payments
for select
using (
    exists (
        select 1 from public.teachers
        where teachers.id = teacher_payments.teacher_id
        and teachers.profile_id = auth.uid()
    )
);

-- Trigger for updated_at
create trigger teacher_payments_updated_at
    before update on public.teacher_payments
    for each row execute function public.set_updated_at();
