-- ============================================================
--  RMSPS — Residential Maa Saraswati Public School
--  Production Database Schema
--  Run this entire file in Supabase SQL Editor (SQL tab)
-- ============================================================

-- -------------------------------------------------------
-- 0. EXTENSIONS
-- -------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- -------------------------------------------------------
-- 1. ENUMS
-- -------------------------------------------------------
do $$ begin
  create type user_role        as enum ('admin', 'teacher', 'parent', 'student');
  create type attendance_status as enum ('present', 'absent', 'late', 'half_day', 'holiday');
  create type exam_type        as enum ('unit_test', 'mid_term', 'pre_board', 'final', 'other');
  create type notice_target    as enum ('all', 'teachers', 'parents', 'students');
exception
  when duplicate_object then null;
end $$;


-- -------------------------------------------------------
-- 2. HELPER: updated_at trigger function
-- -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -------------------------------------------------------
-- 3. PROFILES  (extends auth.users 1-to-1)
-- -------------------------------------------------------
create table if not exists public.profiles (
  id                uuid         primary key references auth.users(id) on delete cascade,
  role              user_role    not null default 'student',
  full_name         text         not null,
  dob               date,
  address           text,
  mobile            text         check (mobile ~ '^\+?[0-9]{7,15}$'),
  profile_photo_url text,
  is_active         boolean      not null default true,
  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a skeleton profile on new auth user sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -------------------------------------------------------
-- 4. CLASSES
-- -------------------------------------------------------
create table if not exists public.classes (
  id          uuid      primary key default uuid_generate_v4(),
  class_name  text      not null,                -- e.g. "Class 10"
  section     text      not null,                -- e.g. "A"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (class_name, section)
);

create trigger classes_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();


-- -------------------------------------------------------
-- 5. TEACHERS
-- -------------------------------------------------------
create table if not exists public.teachers (
  id             uuid       primary key default uuid_generate_v4(),
  profile_id     uuid       not null unique references public.profiles(id) on delete cascade,
  teacher_id     text       not null unique,       -- custom format e.g. "TCH-2024-001"
  joining_date   date       not null default current_date,
  qualification  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger teachers_updated_at
  before update on public.teachers
  for each row execute function public.set_updated_at();

-- Junction: teacher ↔ classes (a teacher can handle multiple classes/subjects)
create table if not exists public.teacher_classes (
  teacher_id  uuid not null references public.teachers(id) on delete cascade,
  class_id    uuid not null references public.classes(id)  on delete cascade,
  subject     text not null,
  primary key (teacher_id, class_id, subject)
);


-- -------------------------------------------------------
-- 6. STUDENTS
-- -------------------------------------------------------
create table if not exists public.students (
  id              uuid       primary key default uuid_generate_v4(),
  profile_id      uuid       not null unique references public.profiles(id) on delete cascade,
  class_id        uuid       not null references public.classes(id) on delete restrict,
  student_id      text       not null unique,       -- custom format e.g. "STU-2024-001"
  father_name     text,
  mother_name     text,
  admission_date  date       not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();


-- -------------------------------------------------------
-- 7. PARENTS
-- -------------------------------------------------------
create table if not exists public.parents (
  id          uuid       primary key default uuid_generate_v4(),
  profile_id  uuid       not null unique references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger parents_updated_at
  before update on public.parents
  for each row execute function public.set_updated_at();

-- Junction: parent ↔ students  (one parent → many students, one student → many parents)
create table if not exists public.parent_students (
  parent_id   uuid not null references public.parents(id)  on delete cascade,
  student_id  uuid not null references public.students(id) on delete cascade,
  relation    text not null default 'guardian',   -- 'father','mother','guardian'
  primary key (parent_id, student_id)
);


-- -------------------------------------------------------
-- 8. TEACHER ATTENDANCE  (supports geo-fencing + live photo)
-- -------------------------------------------------------
create table if not exists public.teacher_attendance (
  id            uuid              primary key default uuid_generate_v4(),
  teacher_id    uuid              not null references public.teachers(id) on delete cascade,
  date          date              not null default current_date,
  status        attendance_status not null default 'present',
  check_in_at   timestamptz,
  check_out_at  timestamptz,
  location_lat  double precision  check (location_lat  between -90  and  90),
  location_lng  double precision  check (location_lng  between -180 and 180),
  photo_url     text,
  remarks       text,
  created_at    timestamptz       not null default now(),
  updated_at    timestamptz       not null default now(),
  unique (teacher_id, date)
);

create trigger teacher_attendance_updated_at
  before update on public.teacher_attendance
  for each row execute function public.set_updated_at();

create index if not exists idx_teacher_attendance_teacher_date
  on public.teacher_attendance (teacher_id, date);


-- -------------------------------------------------------
-- 9. STUDENT ATTENDANCE
-- -------------------------------------------------------
create table if not exists public.student_attendance (
  id          uuid              primary key default uuid_generate_v4(),
  student_id  uuid              not null references public.students(id) on delete cascade,
  class_id    uuid              not null references public.classes(id)  on delete restrict,
  date        date              not null default current_date,
  status      attendance_status not null default 'present',
  marked_by   uuid              references public.teachers(id) on delete set null,
  remarks     text,
  created_at  timestamptz       not null default now(),
  updated_at  timestamptz       not null default now(),
  unique (student_id, date)
);

create trigger student_attendance_updated_at
  before update on public.student_attendance
  for each row execute function public.set_updated_at();

create index if not exists idx_student_attendance_student_date
  on public.student_attendance (student_id, date);
create index if not exists idx_student_attendance_class_date
  on public.student_attendance (class_id, date);


-- -------------------------------------------------------
-- 10. RESULTS
-- -------------------------------------------------------
create table if not exists public.results (
  id              uuid        primary key default uuid_generate_v4(),
  student_id      uuid        not null references public.students(id) on delete cascade,
  class_id        uuid        not null references public.classes(id)  on delete restrict,
  exam_type       exam_type   not null,
  subject         text        not null,
  marks_obtained  numeric(6,2) not null check (marks_obtained >= 0),
  total_marks     numeric(6,2) not null check (total_marks    >  0),
  marks_check     boolean     generated always as (marks_obtained <= total_marks) stored,
  uploaded_by     uuid        references public.teachers(id) on delete set null,
  is_approved     boolean     not null default false,
  approved_by     uuid        references public.profiles(id) on delete set null,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (student_id, exam_type, subject)
);

create trigger results_updated_at
  before update on public.results
  for each row execute function public.set_updated_at();

create index if not exists idx_results_student
  on public.results (student_id);
create index if not exists idx_results_class_exam
  on public.results (class_id, exam_type);


-- -------------------------------------------------------
-- 11. NOTICES
-- -------------------------------------------------------
create table if not exists public.notices (
  id           uuid          primary key default uuid_generate_v4(),
  title        text          not null,
  content      text          not null,
  target_role  notice_target not null default 'all',
  created_by   uuid          references public.profiles(id) on delete set null,
  is_published boolean       not null default true,
  expires_at   timestamptz,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

create trigger notices_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();

create index if not exists idx_notices_target
  on public.notices (target_role, is_published, created_at desc);


-- ============================================================
-- 12.  ROW LEVEL SECURITY — Enable on ALL tables
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.classes           enable row level security;
alter table public.teachers          enable row level security;
alter table public.teacher_classes   enable row level security;
alter table public.students          enable row level security;
alter table public.parents           enable row level security;
alter table public.parent_students   enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.student_attendance enable row level security;
alter table public.results           enable row level security;
alter table public.notices           enable row level security;


-- ============================================================
-- 13. HELPER FUNCTIONS FOR RLS  (security definer so they are
--     evaluated once per query, not per row — much faster)
-- ============================================================

-- Returns the role of the currently authenticated user
create or replace function public.auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Returns true when the current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Returns the teacher row for the current user (null if not a teacher)
create or replace function public.my_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.teachers where profile_id = auth.uid();
$$;

-- Returns the student row for the current user (null if not a student)
create or replace function public.my_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.students where profile_id = auth.uid();
$$;

-- Returns the parent row for the current user (null if not a parent)
create or replace function public.my_parent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.parents where profile_id = auth.uid();
$$;

-- Returns set of student ids linked to the current parent
create or replace function public.my_children_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select student_id
  from public.parent_students
  where parent_id = public.my_parent_id();
$$;

-- Returns set of class ids the current teacher is assigned to
create or replace function public.my_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select class_id
  from public.teacher_classes
  where teacher_id = public.my_teacher_id();
$$;


-- ============================================================
-- 14. RLS POLICIES
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
-- Admins see all; everyone else sees only their own profile
create policy "profiles: admin full access"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles: own read"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: own update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Teachers can see profiles of students in their classes
create policy "profiles: teacher reads student profiles"
  on public.profiles for select
  using (
    public.auth_role() = 'teacher'
    and id in (
      select s.profile_id
      from public.students s
      where s.class_id in (select public.my_class_ids())
    )
  );

-- Parents can see their linked children's profiles
create policy "profiles: parent reads children profiles"
  on public.profiles for select
  using (
    public.auth_role() = 'parent'
    and id in (
      select s.profile_id
      from public.students s
      where s.id in (select public.my_children_ids())
    )
  );


-- ── classes ───────────────────────────────────────────────
create policy "classes: admin full access"
  on public.classes for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "classes: teachers read their classes"
  on public.classes for select
  using (
    public.auth_role() = 'teacher'
    and id in (select public.my_class_ids())
  );

create policy "classes: students read own class"
  on public.classes for select
  using (
    public.auth_role() = 'student'
    and id = (select class_id from public.students where profile_id = auth.uid())
  );

create policy "classes: parents read children classes"
  on public.classes for select
  using (
    public.auth_role() = 'parent'
    and id in (
      select class_id from public.students
      where id in (select public.my_children_ids())
    )
  );


-- ── teachers ──────────────────────────────────────────────
create policy "teachers: admin full access"
  on public.teachers for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "teachers: own read/update"
  on public.teachers for select
  using (profile_id = auth.uid());

create policy "teachers: students/parents see teacher list"
  on public.teachers for select
  using (public.auth_role() in ('student', 'parent'));


-- ── teacher_classes ───────────────────────────────────────
create policy "teacher_classes: admin full access"
  on public.teacher_classes for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "teacher_classes: teacher reads own"
  on public.teacher_classes for select
  using (teacher_id = public.my_teacher_id());

create policy "teacher_classes: students/parents read"
  on public.teacher_classes for select
  using (public.auth_role() in ('student', 'parent'));


-- ── students ──────────────────────────────────────────────
create policy "students: admin full access"
  on public.students for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "students: own read"
  on public.students for select
  using (profile_id = auth.uid());

create policy "students: teacher reads class students"
  on public.students for select
  using (
    public.auth_role() = 'teacher'
    and class_id in (select public.my_class_ids())
  );

create policy "students: parent reads own children"
  on public.students for select
  using (
    public.auth_role() = 'parent'
    and id in (select public.my_children_ids())
  );


-- ── parents ───────────────────────────────────────────────
create policy "parents: admin full access"
  on public.parents for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "parents: own read"
  on public.parents for select
  using (profile_id = auth.uid());

create policy "parents: teacher reads"
  on public.parents for select
  using (public.auth_role() = 'teacher');


-- ── parent_students ───────────────────────────────────────
create policy "parent_students: admin full access"
  on public.parent_students for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "parent_students: parent reads own links"
  on public.parent_students for select
  using (parent_id = public.my_parent_id());

create policy "parent_students: teacher reads"
  on public.parent_students for select
  using (public.auth_role() = 'teacher');


-- ── teacher_attendance ────────────────────────────────────
create policy "teacher_attendance: admin full access"
  on public.teacher_attendance for all
  using (public.is_admin())
  with check (public.is_admin());

-- Teachers can insert/update ONLY their own attendance record
create policy "teacher_attendance: teacher insert own"
  on public.teacher_attendance for insert
  with check (teacher_id = public.my_teacher_id());

create policy "teacher_attendance: teacher update own"
  on public.teacher_attendance for update
  using  (teacher_id = public.my_teacher_id())
  with check (teacher_id = public.my_teacher_id());

create policy "teacher_attendance: teacher read own"
  on public.teacher_attendance for select
  using (teacher_id = public.my_teacher_id());


-- ── student_attendance ────────────────────────────────────
create policy "student_attendance: admin full access"
  on public.student_attendance for all
  using (public.is_admin())
  with check (public.is_admin());

-- Teachers can mark/update attendance only for their classes
create policy "student_attendance: teacher insert class"
  on public.student_attendance for insert
  with check (
    public.auth_role() = 'teacher'
    and class_id in (select public.my_class_ids())
  );

create policy "student_attendance: teacher update class"
  on public.student_attendance for update
  using (
    public.auth_role() = 'teacher'
    and class_id in (select public.my_class_ids())
  )
  with check (
    public.auth_role() = 'teacher'
    and class_id in (select public.my_class_ids())
  );

create policy "student_attendance: teacher read class"
  on public.student_attendance for select
  using (
    public.auth_role() = 'teacher'
    and class_id in (select public.my_class_ids())
  );

-- Students see only their own attendance
create policy "student_attendance: student read own"
  on public.student_attendance for select
  using (
    public.auth_role() = 'student'
    and student_id = public.my_student_id()
  );

-- Parents see their children's attendance
create policy "student_attendance: parent reads children"
  on public.student_attendance for select
  using (
    public.auth_role() = 'parent'
    and student_id in (select public.my_children_ids())
  );


-- ── results ───────────────────────────────────────────────
create policy "results: admin full access"
  on public.results for all
  using (public.is_admin())
  with check (public.is_admin());

-- Teachers can upload results for their classes
create policy "results: teacher insert class"
  on public.results for insert
  with check (
    public.auth_role() = 'teacher'
    and class_id in (select public.my_class_ids())
  );

-- Teachers can update their own uploaded results (only if not yet approved)
create policy "results: teacher update own unapproved"
  on public.results for update
  using (
    public.auth_role() = 'teacher'
    and uploaded_by = public.my_teacher_id()
    and is_approved = false
  )
  with check (
    public.auth_role() = 'teacher'
    and uploaded_by = public.my_teacher_id()
    and is_approved = false
  );

-- Teachers can read results in their classes
create policy "results: teacher read class"
  on public.results for select
  using (
    public.auth_role() = 'teacher'
    and class_id in (select public.my_class_ids())
  );

-- Students can only read their own APPROVED results
create policy "results: student read own approved"
  on public.results for select
  using (
    public.auth_role() = 'student'
    and student_id = public.my_student_id()
    and is_approved = true
  );

-- Parents can read their children's APPROVED results
create policy "results: parent reads children approved"
  on public.results for select
  using (
    public.auth_role() = 'parent'
    and student_id in (select public.my_children_ids())
    and is_approved = true
  );


-- ── notices ───────────────────────────────────────────────
create policy "notices: admin full access"
  on public.notices for all
  using (public.is_admin())
  with check (public.is_admin());

-- Teachers can create notices and read their own + 'all' + 'teachers'
create policy "notices: teacher insert"
  on public.notices for insert
  with check (
    public.auth_role() = 'teacher'
    and created_by = auth.uid()
  );

create policy "notices: teacher read relevant"
  on public.notices for select
  using (
    public.auth_role() = 'teacher'
    and is_published = true
    and target_role in ('all', 'teachers')
  );

-- Students read published notices targeted at them or all
create policy "notices: student read relevant"
  on public.notices for select
  using (
    public.auth_role() = 'student'
    and is_published = true
    and target_role in ('all', 'students')
  );

-- Parents read published notices targeted at them or all
create policy "notices: parent read relevant"
  on public.notices for select
  using (
    public.auth_role() = 'parent'
    and is_published = true
    and target_role in ('all', 'parents')
  );


-- ============================================================
-- 15. STORAGE BUCKET HINTS  (run separately in Storage tab
--     or via supabase-cli if you want RLS on storage too)
-- ============================================================
-- insert into storage.buckets (id, name, public)
--   values ('profile-photos',   'profile-photos',   false),
--          ('attendance-photos', 'attendance-photos', false);
--
-- -- Only the owner or an admin can upload their profile photo
-- create policy "profile-photos: owner upload"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'profile-photos'
--     and auth.uid()::text = (storage.foldername(name))[1]
--   );


-- ============================================================
-- END OF SCHEMA
-- ============================================================
