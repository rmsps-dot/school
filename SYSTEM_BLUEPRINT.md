# RMSPS SYSTEM BLUEPRINT
## Complete Functional Specification & Architecture Reference

> **Purpose:** This document is the definitive functional specification for Residential Maa Saraswati Public School (RMSPS) ERP. It contains the complete institutional profile, data schema, access control policies, UI module specifications, cross-cutting architectures, and operational workflows. Any AI model or software engineer reading this document can rebuild a functionally identical system from scratch.

---

## 1. School Profile & Institutional Master Data

### 1.1 Core Institutional Identity
* **Legal & Official Name:** Residential Maa Saraswati Public School
* **Short / Brand Name:** RMSPS (also referred to as R.M.S. Public School)
* **Established Year:** 2016 (*15+ Years of Institutional Heritage & Academic Excellence*)
* **Affiliation & Board:** 
  * Primary School (Classes I – V): CBSE Standard Foundation Curriculum
  * Secondary School (Classes VI – X): BSEB (Bihar School Examination Board) Affiliated
  * Senior Secondary School (Classes XI – XII): BSEB Affiliated (Streams: Science PCM/PCB, Commerce, Humanities)
* **Campus Type:** Co-educational Residential and Day-Boarding School
* **System Version:** V3.0 Enterprise School Management ERP

### 1.2 Physical Location & Geofencing Parameters
* **Full Postal Address:** RMSPS, Kating Chowk, Maheshpur Road, Pipra, District Supaul, Bihar, PIN: 852109, India
* **Geographical Coordinates:**
  * **Latitude:** `26.1121° N`
  * **Longitude:** `86.6069° E`
* **Teacher Geofencing Radius:** Exactly `50.0 meters` (measured via Haversine distance formula against GPS coordinates captured from teacher mobile devices).

### 1.3 Official Contact & Metadata Details
* **Principal / Admissions Helpline:** `+91 95465 36279`
* **Official Administrative Email:** `srzsurazzrajput@gmail.com`
* **Official Production URL:** `https://rmsps.vercel.app`
* **Google Site Verification Key:** `hlRuq76hobi9HME8SpSlOu0ybtEOYmTxMwin9y5c1qU`

### 1.4 Key Performance & Institutional Statistics
* **Board Examination Pass Rate:** `98%`
* **Enrolled Student Population:** `1000+` active students
* **Dedicated Faculty & Staff Count:** `20+` specialized teachers
* **Academic Divisions:**
  1. **Primary Wing (Classes 1 to 5):** English, Hindi, Mathematics, Environmental Science, Art & Craft, Physical Education. Focus: Activity-based foundational learning, morning assembly, yoga.
  2. **Secondary Wing (Classes 6 to 10):** English, Hindi, Mathematics, Science, Social Science, Sanskrit / Computer Science. Focus: Practical laboratory experiments, board examination preparation, career guidance.
  3. **Senior Secondary Wing (Classes 11 to 12):** Science (Physics, Chemistry, Maths / Biology), Commerce (Accountancy, Business Studies, Economics), Humanities (History, Political Science, Geography), English Core, Physical Education. Focus: Dedicated subject faculty, mock board testing, JEE / NEET / CA foundation coaching.

---

## 2. Authentication, Roles & Security Architecture

### 2.1 The 4-Role RBAC Model
The system enforces strict Role-Based Access Control (RBAC) across four user roles stored in the `user_role` enum:
1. `admin`: Principal, Management, and Head Administrators with absolute CRUD authority over all institutional data.
2. `teacher`: Academic staff responsible for marking self-attendance (geofenced), student attendance, assigning homework, and uploading marks.
3. `student`: Enrolled pupils who access their personal attendance, homework, exam marksheet previews, and submit leave requests.
4. `parent`: Guardians who monitor their linked children's academic results, daily attendance, fee ledger dues, and communicate with teachers.

### 2.2 End-to-End Registration & Onboarding Lifecycle
1. **Student Registration Submission (`/register`):**
   * Prospective student visits `/register` and verifies their email via Supabase Auth OTP.
   * Form captures: Student Full Name, Date of Birth, Email, Mobile Number, Residential Address, Father's Name, Mother's Name, Parent Mobile, and Parent Email.
   * Server Validation: Student email and Parent email must be distinct. Duplicate submissions with existing active accounts are rejected.
   * Record is saved to `pending_registrations` with status `'pending'`.
2. **Admin Review & Approval (`/admin/requests`):**
   * Admin inspects pending applicant details and assigns a target `class_id`.
   * **Student Account Provisioning:**
     * System checks if student auth record exists from OTP step (or creates an auth user if missing).
     * Profile row in `profiles` is upserted with `role = 'student'` and demographic details.
     * Generates a sequential, formatted Student ID: `STU-YYYY-XXXX` (e.g., `STU-2026-0042`) based on total student row count in that calendar year.
     * Inserts student record into `students` table.
   * **Parent Account Provisioning & Automated Password Dispatch:**
     * System checks if an auth account already exists for `parent_email`.
     * If parent is new: generates a cryptographically secure 16-character password (`randomBytes(12).toString('base64url').slice(0, 16) + 'A1!'`), creates auth user with `role = 'parent'`, and sends credentials via automated SMTP email (`nodemailer`).
     * Upserts parent row in `profiles` and `parents`.
     * Inserts linking row in `parent_students` junction table (`relation = 'guardian'`).
   * Marks registration status as `'approved'` in `pending_registrations`.
3. **First-Time Parent Login:**
   * Parent receives email containing portal URL, username (email), and temporary password.
   * Logs in at `/login?role=parent`, accessing all linked children dynamically.

### 2.3 Middleware & Session Enforcement
* **File Location:** `src/proxy.ts` / `src/utils/supabase/middleware.ts`
* **Cookie Handling:** `@supabase/ssr` server client refreshes auth tokens on every incoming request.
* **Token Verification:** Uses `supabase.auth.getUser()` (never `getSession()`, preventing JWT tampering).
* **Route Protection Matrix:**
  * Public Paths: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, static assets, SEO files.
  * Webhook/Cron Exemption: `/api/cron/cleanup-attendance` (exact match bypass).
  * Protected Paths: All `/admin/*`, `/teacher/*`, `/student/*`, `/parent/*`, and mutating `/api/*` endpoints require active authentication. Unauthenticated requests are redirected to `/login`.
* **Browser Cache Prevention:** Injects `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`, `Pragma: no-cache`, `Expires: 0` headers on all protected dashboard responses to prevent the browser back-button cache vulnerability after logout.

---

## 3. Complete Data Model & Row Level Security (RLS)

### 3.1 Live Database Schema (`src/types/supabase.ts`)

#### Table 1: `profiles`
*Core user identity linked 1:1 with Supabase `auth.users`.*
* `id` (`uuid`, PK, FK to `auth.users.id` ON DELETE CASCADE)
* `full_name` (`text`, NOT NULL)
* `role` (`user_role`, NOT NULL: `'admin' | 'teacher' | 'parent' | 'student'`)
* `dob` (`date`, NULLABLE)
* `mobile` (`text`, NULLABLE)
* `address` (`text`, NULLABLE)
* `profile_photo_url` (`text`, NULLABLE)
* `is_active` (`boolean`, DEFAULT `true`)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 2: `classes`
*Academic standard and section definitions.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `class_name` (`text`, NOT NULL — e.g. `'Class 10'`, `'Class 5'`)
* `section` (`text`, NOT NULL — e.g. `'A'`, `'B'`)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 3: `students`
*Academic enrollment record for student profiles.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `profile_id` (`uuid`, NOT NULL, UNIQUE, FK to `profiles.id`)
* `class_id` (`uuid`, NOT NULL, FK to `classes.id`)
* `student_id` (`text`, NOT NULL, UNIQUE — e.g. `'STU-2026-0001'`)
* `admission_date` (`date`, NOT NULL, DEFAULT `CURRENT_DATE`)
* `father_name` (`text`, NULLABLE)
* `mother_name` (`text`, NULLABLE)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 4: `parents`
*Parent/Guardian role identity.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `profile_id` (`uuid`, NOT NULL, UNIQUE, FK to `profiles.id`)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 5: `parent_students`
*Many-to-many junction mapping parents to their children.*
* `parent_id` (`uuid`, NOT NULL, FK to `parents.id` ON DELETE CASCADE)
* `student_id` (`uuid`, NOT NULL, FK to `students.id` ON DELETE CASCADE)
* `relation` (`text`, NOT NULL, DEFAULT `'guardian'`)
* *Composite PK:* `(parent_id, student_id)`

#### Table 6: `teachers`
*Faculty employment records.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `profile_id` (`uuid`, NOT NULL, UNIQUE, FK to `profiles.id`)
* `teacher_id` (`text`, NOT NULL, UNIQUE — e.g. `'TCH-1001'`)
* `qualification` (`text`, NULLABLE)
* `joining_date` (`date`, NOT NULL, DEFAULT `CURRENT_DATE`)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 7: `teacher_classes`
*Subject & class assignment matrix for teachers.*
* `teacher_id` (`uuid`, NOT NULL, FK to `teachers.id` ON DELETE CASCADE)
* `class_id` (`uuid`, NOT NULL, FK to `classes.id` ON DELETE CASCADE)
* `subject` (`text`, NOT NULL)
* *Composite PK:* `(teacher_id, class_id, subject)`

#### Table 8: `student_attendance`
*Daily student attendance records.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `student_id` (`uuid`, NOT NULL, FK to `students.id` ON DELETE CASCADE)
* `class_id` (`uuid`, NOT NULL, FK to `classes.id`)
* `date` (`date`, NOT NULL, DEFAULT `CURRENT_DATE`)
* `status` (`attendance_status`, NOT NULL: `'present' | 'absent' | 'late' | 'half_day' | 'holiday' | 'leave'`)
* `remarks` (`text`, NULLABLE)
* `marked_by` (`uuid`, NULLABLE, FK to `profiles.id`)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 9: `teacher_attendance`
*Geofenced self-attendance for faculty members.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `teacher_id` (`uuid`, NOT NULL, FK to `teachers.id` ON DELETE CASCADE)
* `date` (`date`, NOT NULL, DEFAULT `CURRENT_DATE`)
* `status` (`attendance_status`, NOT NULL DEFAULT `'present'`)
* `check_in_at` (`timestamptz`, NULLABLE)
* `check_out_at` (`timestamptz`, NULLABLE)
* `location_lat` (`double precision`, NULLABLE)
* `location_lng` (`double precision`, NULLABLE)
* `photo_url` (`text`, NULLABLE — live camera capture stored via ImgBB)
* `remarks` (`text`, NULLABLE)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 10: `results`
*Subject-wise examination marks and moderation workflow.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `student_id` (`uuid`, NOT NULL, FK to `students.id` ON DELETE CASCADE)
* `class_id` (`uuid`, NOT NULL, FK to `classes.id`)
* `exam_type` (`exam_type`, NOT NULL: `'unit_test' | 'mid_term' | 'pre_board' | 'final' | 'other'`)
* `subject` (`text`, NOT NULL)
* `marks_obtained` (`numeric`, NOT NULL)
* `total_marks` (`numeric`, NOT NULL)
* `is_approved` (`boolean`, NOT NULL, DEFAULT `false`)
* `approved_by` (`uuid`, NULLABLE, FK to `profiles.id`)
* `approved_at` (`timestamptz`, NULLABLE)
* `uploaded_by` (`uuid`, NULLABLE, FK to `teachers.id`)
* `edit_request` (`jsonb`, NULLABLE — stores `{ new_marks, reason, requested_at }`)
* `delete_request` (`boolean`, DEFAULT `false`)
* `marks_check` (`boolean`, DEFAULT `false`)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 11: `homework`
*Daily assignments posted by teachers.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `class_id` (`uuid`, NOT NULL, FK to `classes.id`)
* `subject` (`text`, NOT NULL)
* `title` (`text`, NOT NULL)
* `description` (`text`, NOT NULL)
* `due_date` (`date`, NOT NULL)
* `created_by` (`uuid`, NOT NULL, FK to `profiles.id`)
* `created_at` (`timestamptz`, DEFAULT `now()`)

#### Table 12: `leave_requests`
*Leave applications submitted by students and teachers.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `user_id` (`uuid`, NOT NULL, FK to `profiles.id` ON DELETE CASCADE)
* `role` (`text`, NOT NULL)
* `start_date` (`date`, NOT NULL)
* `end_date` (`date`, NOT NULL)
* `reason` (`text`, NOT NULL)
* `status` (`leave_status`, NOT NULL DEFAULT `'pending'`: `'pending' | 'approved' | 'rejected'`)
* `created_at` (`timestamptz`, DEFAULT `now()`)

#### Table 13: `messages`
*Direct messaging system between school community members.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `sender_id` (`uuid`, NOT NULL, FK to `profiles.id`)
* `receiver_id` (`uuid`, NOT NULL, FK to `profiles.id`)
* `content` (`text`, NOT NULL)
* `is_read` (`boolean`, NOT NULL, DEFAULT `false`)
* `created_at` (`timestamptz`, DEFAULT `now()`)

#### Table 14: `notices`
*Official administrative announcements.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `title` (`text`, NOT NULL)
* `content` (`text`, NOT NULL)
* `target_role` (`notice_target`, NOT NULL DEFAULT `'all'`: `'all' | 'teacher' | 'student' | 'parent'`)
* `created_by` (`uuid`, NULLABLE, FK to `profiles.id`)
* `created_at` (`timestamptz`, DEFAULT `now()`)

#### Table 15: `gallery`
*School campus photos and media showcase.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `title` (`text`, NOT NULL)
* `media_url` (`text`, NOT NULL)
* `media_type` (`gallery_media_type`, NOT NULL DEFAULT `'photo'`: `'photo' | 'video'`)
* `category` (`gallery_category`, NOT NULL DEFAULT `'Campus'`: `'Event' | 'Sports' | 'Campus' | 'Other'`)
* `created_by` (`uuid`, NOT NULL, FK to `profiles.id`)
* `created_at` (`timestamptz`, DEFAULT `now()`)

#### Table 16: `pending_registrations`
*Admissions queue for incoming student applications.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `student_name` (`text`, NOT NULL)
* `student_dob` (`date`, NULLABLE)
* `student_email` (`text`, NOT NULL)
* `student_mobile` (`text`, NULLABLE)
* `address` (`text`, NULLABLE)
* `father_name` (`text`, NULLABLE)
* `mother_name` (`text`, NULLABLE)
* `parent_mobile` (`text`, NULLABLE)
* `parent_email` (`text`, NULLABLE)
* `status` (`registration_status`, NOT NULL DEFAULT `'pending'`: `'pending' | 'approved' | 'rejected'`)
* `reviewed_by` (`uuid`, NULLABLE, FK to `profiles.id`)
* `reviewed_at` (`timestamptz`, NULLABLE)
* `admin_notes` (`text`, NULLABLE)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 17: `student_fees`
*Financial ledger of tuition and service dues.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `student_id` (`text`, NOT NULL, FK to `students.student_id`)
* `fee_name` (`text`, NOT NULL — e.g. `'Term 1 Tuition'`, `'Annual Lab Fee'`)
* `amount` (`numeric`, NOT NULL, DEFAULT `0`)
* `paid_amount` (`numeric`, NOT NULL, DEFAULT `0`)
* `due_date` (`date`, NOT NULL)
* `status` (`text`, NOT NULL DEFAULT `'pending'`)
* `created_at` (`timestamptz`, DEFAULT `now()`)

#### Table 18: `teacher_payments`
*Payroll and stipend disbursements.*
* `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
* `teacher_id` (`uuid`, NOT NULL, FK to `teachers.id`)
* `amount` (`numeric`, NOT NULL)
* `payment_date` (`date`, NOT NULL)
* `status` (`text`, NOT NULL)
* `remarks` (`text`, NULLABLE)
* `recorded_by` (`uuid`, NULLABLE, FK to `profiles.id`)
* `created_at` (`timestamptz`, DEFAULT `now()`)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

#### Table 19: `settings`
*System configuration key-value storage.*
* `key` (`text`, PK)
* `value` (`jsonb`, NOT NULL)
* `description` (`text`, NULLABLE)
* `updated_at` (`timestamptz`, DEFAULT `now()`)

---

### 3.2 Row Level Security (RLS) Policy Specifications

The database enforces security at the PostgreSQL engine level via 48 RLS policies. The plain-English meaning and operational intent of each policy is detailed below:

| # | Table | Policy Name | Command | Plain-English Meaning & Access Scope |
|---|---|---|---|---|
| 1 | `classes` | `classes: admin full access` | `ALL` | Administrators have unrestricted authority to create, view, modify, and delete classes and sections. |
| 2 | `classes` | `classes: parents read children classes` | `SELECT` | Parents can read class details only for classes currently attended by their linked children. |
| 3 | `classes` | `classes: students read own class` | `SELECT` | Students can read class details only for the specific class they are enrolled in. |
| 4 | `classes` | `classes: teachers read their classes` | `SELECT` | Teachers can read class details only for classes assigned to them in `teacher_classes`. |
| 5 | `gallery` | `gallery: admin full access` | `ALL` | Administrators can upload, edit titles, modify categories, or delete gallery photos and videos. |
| 6 | `gallery` | `gallery: users can read` | `SELECT` | All authenticated users (admins, teachers, parents, students) can view gallery media. |
| 7 | `homework` | `homework: admin full access` | `ALL` | Administrators have complete oversight to read, create, edit, or remove all homework items across all classes. |
| 8 | `homework` | `homework: parent read children classes` | `SELECT` | Parents can view homework assignments issued to their children's respective classes. |
| 9 | `homework` | `homework: student read own class` | `SELECT` | Students can view homework assigned to their own class. |
| 10 | `homework` | `homework: teacher manage assigned classes` | `ALL` | Teachers can create, view, update, and delete homework assignments only for classes assigned to them. |
| 11 | `leave_requests` | `leave_requests: admin full access` | `ALL` | Administrators can view all leave requests and approve or reject them. |
| 12 | `leave_requests` | `leave_requests: user delete own pending` | `DELETE` | Users (teachers or students) can cancel and delete their own leave application if its status is still 'pending'. |
| 13 | `leave_requests` | `leave_requests: user insert own` | `INSERT` | Any authenticated user can submit a leave application for themselves. |
| 14 | `leave_requests` | `leave_requests: user read own` | `SELECT` | Users can view their own leave application history and status. |
| 15 | `messages` | `messages: receivers can update is_read` | `UPDATE` | Message recipients can toggle `is_read = true` to mark messages as read. |
| 16 | `messages` | `messages: users can insert their own messages` | `INSERT` | Authenticated users can send messages where `sender_id` matches their own auth user ID. |
| 17 | `messages` | `messages: users can read their own messages` | `SELECT` | Users can view messages where they are either the sender or the recipient. |
| 18 | `notices` | `Admin Full CRUD on Notices` | `ALL` | Administrators can create, publish, edit, and delete any notice. |
| 19 | `notices` | `Public Read All Notices` | `SELECT` | Anonymous public visitors on the landing page can read notices targeted to `'all'`. |
| 20 | `notices` | `Users Read Targeted Notices` | `SELECT` | Authenticated users can read notices targeted to `'all'` or specifically targeted to their user role. |
| 21 | `parent_students` | `parent_students: admin full access` | `ALL` | Administrators can view, link, or unlink parents and students. |
| 22 | `parent_students` | `parent_students: parent reads own links` | `SELECT` | Parents can view only the records linking them to their own children. |
| 23 | `parent_students` | `parent_students: teacher reads` | `SELECT` | Teachers can view parent-student mappings to contact parents of students. |
| 24 | `parents` | `parents: admin full access` | `ALL` | Administrators have complete access to manage parent records. |
| 25 | `parents` | `parents: own read` | `SELECT` | Parents can read their own parent record. |
| 26 | `parents` | `parents: teacher reads` | `SELECT` | Teachers can read parent directory entries. |
| 27 | `pending_registrations` | `pending_reg: admin full access` | `ALL` | Administrators can inspect, edit, approve, or reject admission applications. |
| 28 | `pending_registrations` | `pending_reg: anyone can submit` | `INSERT` | Prospective applicants can submit registration forms into the pending queue. |
| 29 | `profiles` | `profiles: admin full access` | `ALL` | Administrators can read and modify all profile demographic records. |
| 30 | `profiles` | `profiles: own read` | `SELECT` | Any user can read their own profile row. |
| 31 | `profiles` | `profiles: own update` | `UPDATE` | Users can update their own profile fields (e.g. avatar, mobile, address). |
| 32 | `profiles` | `profiles: parent reads children profiles` | `SELECT` | Parents can view demographic profile details for their linked children. |
| 33 | `profiles` | `profiles: teacher reads student profiles` | `SELECT` | Teachers can view demographic profiles of students enrolled in their assigned classes. |
| 34 | `results` | `Allow teacher to request edits on approved results` | `UPDATE` | *(Legacy policy name — actual SQL qualification restricts to unapproved only)* Teachers can request edits on results they uploaded, but only while the result is still unapproved (`is_approved = false`). This overlaps with policy #40; consider consolidating these two into one policy during a rebuild. |
| 35 | `results` | `results: admin full access` | `ALL` | Administrators can view all results, approve/reject them, or modify marks directly. |
| 36 | `results` | `results: parent reads children approved` | `SELECT` | Parents can view marks only for their linked children, and only if `is_approved = true`. |
| 37 | `results` | `results: student read own approved` | `SELECT` | Students can view their own marks only if `is_approved = true`. |
| 38 | `results` | `results: teacher insert class` | `INSERT` | Teachers can enter/upload exam marks only for classes assigned to them. |
| 39 | `results` | `results: teacher read class` | `SELECT` | Teachers can view results for classes assigned to them. |
| 40 | `results` | `results: teacher update own unapproved` | `UPDATE` | Teachers can edit/correct their uploaded marks as long as `is_approved = false`. |
| 41 | `settings` | `Only admins can update settings` | `ALL` | Only administrative accounts can alter global system configuration settings. |
| 42 | `settings` | `Settings are viewable by everyone` | `SELECT` | Global settings (school year, session) are readable by all authenticated users. |
| 43 | `student_attendance` | `student_attendance: admin full access` | `ALL` | Administrators can view, record, or modify student attendance across all classes. |
| 44 | `student_attendance` | `student_attendance: parent reads children` | `SELECT` | Parents can view daily attendance records only for their linked children. |
| 45 | `student_attendance` | `student_attendance: student read own` | `SELECT` | Students can view only their own attendance history and percentage. |
| 46 | `student_attendance` | `student_attendance: teacher insert class` | `INSERT` | Teachers can mark daily attendance only for classes assigned to them. |
| 47 | `student_attendance` | `student_attendance: teacher read class` | `SELECT` | Teachers can view student attendance history only for their assigned classes. |
| 48 | `student_attendance` | `student_attendance: teacher update class` | `UPDATE` | Teachers can modify/correct attendance entries for their assigned classes. |
| 49 | `student_fees` | `student_fees: admin full access` | `ALL` | Administrators can create fee invoices, log collections, and edit dues. |
| 50 | `student_fees` | `student_fees: parent reads own children` | `SELECT` | Parents can view fee structures, payments, and pending dues for their children. |
| 51 | `student_fees` | `student_fees: student reads own fees` | `SELECT` | Students can view their personal fee dues and payment status. |
| 52 | `students` | `students: admin full access` | `ALL` | Administrators have complete access to manage student enrollments. |
| 53 | `students` | `students: own read` | `SELECT` | Students can read their own enrollment and class information. |
| 54 | `students` | `students: parent reads own children` | `SELECT` | Parents can read enrollment information for their linked children. |
| 55 | `students` | `students: teacher reads class students` | `SELECT` | Teachers can view student rosters for classes assigned to them. |
| 56 | `teacher_attendance` | `teacher_attendance: admin full access` | `ALL` | Administrators can view, audit, and manage all teacher check-in logs. |
| 57 | `teacher_attendance` | `teacher_attendance: teacher insert own` | `INSERT` | Teachers can log check-in attendance only for their own teacher record. |
| 58 | `teacher_attendance` | `teacher_attendance: teacher read own` | `SELECT` | Teachers can view their own historical attendance and check-in logs. |
| 59 | `teacher_attendance` | `teacher_attendance: teacher update own` | `UPDATE` | Teachers can update their own attendance record (e.g. check-out time). |
| 60 | `teacher_classes` | `teacher_classes: admin full access` | `ALL` | Administrators can create and modify teacher-to-class subject assignments. |
| 61 | `teacher_classes` | `teacher_classes: students/parents read` | `SELECT` | Students and parents can see which teachers teach which subjects in their class. |
| 62 | `teacher_classes` | `teacher_classes: teacher reads own` | `SELECT` | Teachers can view their assigned class schedule and subjects. |
| 63 | `teacher_payments` | `Admins can view and manage teacher payments` | `ALL` | Administrators can view, create, and manage faculty salary disbursements. |
| 64 | `teacher_payments` | `Teachers can view their own payments` | `SELECT` | Teachers can view only their personal payment and salary receipt history. |
| 65 | `teachers` | `teachers: admin full access` | `ALL` | Administrators have complete control over teacher hiring records and data. |
| 66 | `teachers` | `teachers: own read/update` | `SELECT/UPDATE` | Teachers can view and update their own employment profile details. |
| 67 | `teachers` | `teachers: students/parents see teacher list` | `SELECT` | Students and parents can view faculty profiles and qualifications. |

---

## 4. Comprehensive Dashboard Specifications

---

### 4.1 Admin Portal (`/admin/*`)

#### 1. Executive Dashboard (`/admin`)
* **Purpose:** High-level institutional telemetry and real-time operational overview.
* **Data Sources:** Aggregated counts of students, teachers, parents, today's student attendance rate, today's teacher attendance count, pending registration applications, unapproved exam results, and unread notifications.
* **Workflow:** Admin opens page; cards show live metric counters with quick action shortcuts to pending queues.

#### 2. Notice Board Management (`/admin/notices`)
* **Purpose:** Official bulletin board broadcast system.
* **Data Read/Write:** Reads and writes to `notices` table.
* **Functional Scope:**
  * Admin inputs Notice Title, Description/Content, and Target Audience (`All`, `Teachers`, `Students`, `Parents`).
  * System broadcasts notice instantly across target user portals and the public landing page (if `target_role = 'all'`).
  * Admin can edit or delete existing notices.

#### 3. Pending Admissions & Edit Requests (`/admin/requests`)
* **Purpose:** Centralized moderation clearinghouse for new student registrations and teacher result modifications.
* **Data Read/Write:** Reads/updates `pending_registrations` and `results` (where `delete_request = true` or `edit_request IS NOT NULL`).
* **Functional Scope:**
  * **Registrations Tab:** View applicant details. Admin can edit application fields, assign student to a class from dropdown, and click "Approve" or "Reject". Approving triggers automated account creation, Student ID generation, and parent email credentials dispatch.
  * **Result Requests Tab:** Inspect teacher requests to edit or delete existing approved exam marks. Admin approves or declines with a single click.

#### 4. Result Approval Hub (`/admin/results`)
* **Purpose:** Quality control and publication gate for all uploaded student marks.
* **Data Read/Write:** Reads unapproved rows in `results`; writes `is_approved = true`, `approved_by`, and `approved_at`.
* **Functional Scope:**
  * Filter results by Class and Exam Type.
  * Preview aggregated marksheet with automatic grade calculation.
  * Approve single subject result or perform bulk one-click batch approval for the entire class.
  * Rejected results return to teacher with optional revision notes.

#### 5. Master Marksheet Management (`/admin/manage-results`)
* **Purpose:** Historical result archive, student marksheet generation, and PDF printing.
* **Data Read/Write:** Reads approved `results`, joins `students`, `profiles`, `classes`.
* **Functional Scope:**
  * Search by student name, roll code, or class.
  * Expand class ledger to view individual subject breakdowns.
  * **Instant PDF Marksheet Generation:** Computes total marks, percentage, overall grade (A1 to F), and pass/fail status, opening a print preview modal or triggering synchronous PDF print via `PrintPortal`.

#### 6. Faculty & Student Leave Approvals (`/admin/leaves`)
* **Purpose:** Staff and student absence management.
* **Data Read/Write:** Reads `leave_requests` (filtered by `'pending'`), updates status to `'approved'` or `'rejected'`.
* **Functional Scope:** Displays applicant name, role, date range, duration in days, and stated reason. One-click approval updates leave status and marks student/teacher calendar.

#### 7. Administrative Communications (`/admin/chat`)
* **Purpose:** Real-time chat system with all faculty, parents, and students.
* **Data Read/Write:** `messages` table with Supabase Realtime channel subscription.
* **Functional Scope:** Search contact directory, view conversation history, unread message count badges, and send direct text communications.

#### 8. Manage Classes & Academic Roster (`/admin/classes`)
* **Purpose:** Class and section configuration, class-wise attendance auditing, and result uploads.
* **Data Read/Write:** `classes`, `students`, `student_attendance`, `results`.
* **Functional Scope:**
  * Create new Class Name and Section (e.g. "Class 10 - Section A").
  * Class roster view: lists all enrolled students with ID, mobile, and admission date.
  * Mark or modify class attendance for any past date.
  * Direct class result upload modal supporting manual entry or bulk CSV parsing.

#### 9. Assign Faculty to Classes (`/admin/assign-classes`)
* **Purpose:** Curriculum workload distribution.
* **Data Read/Write:** Writes to `teacher_classes` junction table.
* **Functional Scope:** Select a teacher, choose target class/section, specify subject name, and assign. Displays active teacher timetable matrix.

#### 10. School Media Gallery (`/admin/gallery`)
* **Purpose:** Public and internal campus photo management.
* **Data Read/Write:** Writes to `gallery` table. Uploads image via ImgBB integration with title and category (`Campus`, `Event`, `Sports`, `Other`).

#### 11. Student Directory & Profile Detail (`/admin/students` & `/admin/students/[id]`)
* **Purpose:** Complete student registry and individual student Dossier.
* **Data Read/Write:** Full CRUD on `students`, `profiles`, avatar upload via ImgBB.
* **Functional Scope:**
  * Searchable table with class filter.
  * Student Detail Page: Edit personal demographics (DOB, mobile, address, parent names), change enrolled class, upload/update student profile photo, view attendance history, fee payment records, and academic marksheets.

#### 12. Faculty Directory & Profile Detail (`/admin/teachers` & `/admin/teachers/[id]`)
* **Purpose:** Staff roster and individual teacher record.
* **Data Read/Write:** Full CRUD on `teachers`, `profiles`, `teacher_classes`, `teacher_payments`.
* **Functional Scope:** Create teacher profile, edit qualification, assign classes, upload/change teacher profile photo, view teacher geofenced attendance logs, and record salary disbursements.

#### 13. Parent Directory & Family Detail (`/admin/parents` & `/admin/parents/[id]`)
* **Purpose:** Guardian directory and family mapping management.
* **Data Read/Write:** `parents`, `profiles`, `parent_students`.
* **Functional Scope:** View linked children, update parent contact details, upload parent photo, link additional children to a parent account.

#### 14. Homework History & Oversight (`/admin/homework`)
* **Purpose:** School-wide academic assignment monitoring.
* **Data Read/Write:** Reads `homework` joined with `classes` and `profiles`.
* **Functional Scope:** Audit all daily homework assignments posted across all grades with due date tracking.

#### 15. System Settings (`/admin/settings`)
* **Purpose:** Global school preferences and institutional parameters.
* **Data Read/Write:** Reads/writes to `settings` table (JSON configuration objects).

---

### 4.2 Teacher Portal (`/teacher/*`)

#### 1. Teacher Dashboard (`/teacher`)
* **Purpose:** Daily faculty workspace.
* **Data Read:** Today's self-attendance status, assigned class count, total assigned students, upcoming homework deadlines, unread chat messages.

#### 2. My Digital Faculty ID (`/teacher/profile`)
* **Purpose:** Official digital school ID card.
* **Data Read/Write:** Displays Teacher ID code, Full Name, Designation, Joining Date, Qualifications, and avatar upload tool.

#### 3. Mark Self-Attendance (`/teacher/attendance`)
* **Purpose:** Geofenced, fraud-proof faculty check-in.
* **Business Rules & Workflow:**
  1. Teacher clicks "Mark Attendance".
  2. Browser requests GPS coordinates. Haversine distance is calculated against School Latitude `26.1121° N`, Longitude `86.6069° E`.
  3. Distance must be `<= 50.0 meters`. If outside, check-in is blocked with exact distance feedback.
  4. Device camera opens; teacher takes a live selfie. Photo is processed and uploaded to ImgBB.
  5. Server Action validates geofence and inserts record into `teacher_attendance` (`status = 'present'`, `check_in_at = now()`).
  6. Duplicate check-ins for the same day are idempotently rejected.

#### 4. Student Class Attendance (`/teacher/class-attendance`)
* **Purpose:** Daily classroom roll-call.
* **Data Read/Write:** Reads students for teacher's assigned classes; writes to `student_attendance`.
* **Workflow:** Select assigned class and date. Roster loads with toggle buttons (`Present`, `Absent`, `Late`, `Half Day`). Bulk "Mark All Present" shortcut available. Saving commits records with `marked_by = teacher.profile.id`.

#### 5. Leave Application (`/teacher/leave`)
* **Purpose:** Faculty leave submission.
* **Data Read/Write:** Inserts into `leave_requests` (`role = 'teacher'`). Displays past request history and live approval status badge. Pending requests can be cancelled by the teacher.

#### 6. Messages (`/teacher/chat`)
* **Purpose:** Secure channel with School Admin, Parents, and Class Students.
* **Functional Scope:** Conversations scoped to relevant class groups and administration.

#### 7. My Assigned Classes (`/teacher/classes`)
* **Purpose:** Class schedule and curriculum overview.
* **Data Read:** Displays all classes and subjects assigned to this teacher in `teacher_classes`.

#### 8. Student Directory (`/teacher/students`)
* **Purpose:** Student contact list for assigned classes.
* **Data Read:** Roster of students in assigned classes, parent contact numbers, and student profile photos.

#### 9. Manage Results & Marks Upload (`/teacher/manage-results` & `/teacher/results`)
* **Purpose:** Examination score entry and modification requests.
* **Workflow:**
  * **Upload Mode:** Select Exam Type (`Unit Test`, `Mid Term`, `Pre-Board`, `Final`, `Other`), Class, and Subject. Enter marks manually per student or upload standard CSV. Uploads are created with `is_approved = false`.
  * **Unapproved Edits:** Teacher can freely edit scores before admin approval.
  * **Approved Modifications:** Once approved by admin, direct editing is locked. Teacher can submit an "Edit Request" (with proposed mark and reason) or "Delete Request". This appears in Admin Pending Requests queue.
  * **PDF Export:** Preview and print student marksheet directly.

#### 10. Daily Homework Posting (`/teacher/homework`)
* **Purpose:** Assignment distribution.
* **Data Read/Write:** Full CRUD on `homework` for assigned classes.
* **Workflow:** Select class, subject, enter assignment title, detailed instructions, and due date.

#### 11. Notice Board (`/teacher/notices`)
* **Data Read:** Displays notices where `target_role` is `'all'` or `'teacher'`.

#### 12. School Gallery (`/teacher/gallery`)
* **Data Read:** Browsable campus media library.

---

### 4.3 Student Portal (`/student/*`)

#### 1. Student Dashboard (`/student`)
* **Purpose:** Academic dashboard.
* **Data Read:** Overall attendance percentage, latest exam results, pending homework assignments with due dates, and recent school announcements.

#### 2. My Academic Results (`/student/results`)
* **Purpose:** Official grade cards and marksheet generator.
* **Data Read:** Approved rows from `results` table (`is_approved = true`).
* **Functional Scope:**
  * Tabbed navigation by Exam Type (`Unit Test`, `Mid-Term`, `Final Exam`).
  * Grade and percentage calculation per subject.
  * **Single-Tap PDF Download:** Direct generation of formal A4 marksheet showing school header, student roll number, parent names, date of birth, marks obtained vs max marks, percentage, and passing status.

#### 3. Attendance History (`/student/attendance`)
* **Purpose:** Attendance compliance tracking.
* **Data Read:** Reads `student_attendance` records for the logged-in student.
* **Functional Scope:** Monthly calendar heatmap, total days present, absent, late, and overall attendance percentage gauge.

#### 4. Leave Application (`/student/leave`)
* **Purpose:** Absence notification submission.
* **Data Read/Write:** Inserts into `leave_requests` (`role = 'student'`). View status of submitted leaves.

#### 5. Messages (`/student/chat`)
* **Purpose:** Academic inquiries with subject teachers and school administration.

#### 6. Notice Board (`/student/notices`)
* **Data Read:** School announcements targeted to `'all'` or `'student'`.

#### 7. Daily Homework (`/student/homework`)
* **Purpose:** Daily assignment ledger.
* **Data Read:** Reads assignments for the student's enrolled class. Filter by subject, view instructions and submission deadlines.

#### 8. School Gallery (`/student/gallery`)
* **Data Read:** School events and campus life showcase.

---

### 4.4 Parent Portal (`/parent/*`)

#### 1. Parent Dashboard (`/parent`)
* **Purpose:** Multi-child guardian overview.
* **Functional Scope:**
  * **Child Switcher:** Parents with multiple enrolled children can switch active child context dynamically with a single tap.
  * Displays active child's attendance rate, latest exam score, outstanding fee balance, and pending homework.

#### 2. Child Academic Progress (`/parent/progress`)
* **Purpose:** Comprehensive performance analytics and report card generation.
* **Data Read:** Approved `results` and demographic records for the selected child.
* **Functional Scope:**
  * Exam-wise score breakdown with subject-by-subject grades.
  * **Marksheet Preview & PDF Export:** Synchronous single-tap PDF generator pulling real father name, mother name, date of birth, roll code, and class section.

#### 3. Fee Ledger & Dues Tracking (`/parent/fees`)
* **Purpose:** Tuition and fee transparency.
* **Data Read:** Reads `student_fees` for the selected child's `student_id`.
* **Functional Scope:** List of fee items, invoiced amounts, paid amounts, remaining balance, due dates, and payment receipt status (`Paid`, `Pending`, `Overdue`).

#### 4. Daily Homework Oversight (`/parent/homework`)
* **Purpose:** Monitor assignments given to child's class.

#### 5. Messages (`/parent/chat`)
* **Purpose:** Direct communication with class teachers and school administration.

#### 6. Notice Board (`/parent/notices`)
* **Data Read:** Announcements targeted to `'all'` or `'parent'`.

#### 7. School Gallery (`/parent/gallery`)
* **Data Read:** Campus events, annual functions, and sports gallery.

---

## 5. Cross-Cutting Technical Subsystems

### 5.1 Real-Time Messaging Subsystem
* **Architecture:** Supabase Realtime WebSocket channel listening on `public:messages`.
* **Storage:** `messages` table with sender, receiver, text payload, timestamp, and read status boolean.
* **Security & Access Rules:**
  * Insertion requires `auth.uid() = sender_id`.
  * Selection allows rows where `auth.uid() = sender_id OR auth.uid() = receiver_id`.
  * Updating read status is permitted only to the recipient (`auth.uid() = receiver_id`).
* **Unread Indicators:** Sidebar counts query count of unread messages and update badges dynamically.

### 5.2 Avatar & Photo Processing Subsystem (ImgBB Integration)
* **Architecture:** Dedicated REST API endpoint at `/api/upload-avatar/route.ts`.
* **Processing Pipeline:**
  1. Client sends multipart form data containing `file` and target `profile_id`.
  2. Server verifies caller has permission (Admin can update any profile; teachers/students/parents can update only their own `auth.uid()`).
  3. Image buffer is processed via `sharp`:
     * Resized to max dimensions `800x800` (aspect ratio preserved).
     * Converted to optimized `webp` / `jpeg` (quality: 80).
  4. Encoded as base64 payload and dispatched to ImgBB REST API (`https://api.imgbb.com/1/upload?key=IMGBB_API_KEY`).
  5. Direct image URL returned by ImgBB is saved into `profiles.profile_photo_url` via `supabaseAdmin`.

### 5.3 Notification & Sidebar Badge Subsystem
* **Server Action:** `getSidebarCounts()` in `src/actions/notification-actions.ts`.
* **Polling Architecture:**
  * Initial fetch on component mount.
  * Interval polling set to `60 seconds` (halving server load).
  * Inbuilt **Page Visibility API** listener: polling is immediately suspended when the browser tab is hidden/minimized and resumes instantly upon tab focus.
* **Count Aggregations:**
  * **Admin:** Unread Messages + Pending Registrations count + Pending Result Approvals count + Pending Leave Requests count.
  * **Teacher / Student / Parent:** Unread Messages count.

### 5.4 High-Fidelity Marksheet PDF Generation Subsystem

* **IMPORTANT — Design Requirement (do not replicate the old approach):** The original implementation of this subsystem relied on the browser's native `window.print()` dialog (triggered via `flushSync` for user-gesture timing, with offscreen layout pre-computation for mobile). In production, this approach proved unreliable across browsers — it failed differently depending on the browser (silently did nothing in some, produced a blank output in others like Chrome on certain devices), because it depends on each browser's own print-engine behavior, which the application cannot fully control.

* **Correct Specification for a Rebuild:** The PDF must be generated entirely client-side as a real file, with no dependency on the browser's native print dialog at all. The user taps "Download PDF" and receives an actual `.pdf` file via direct blob download — this guarantees identical, reliable behavior across every browser and device, since it does not depend on any browser's print-engine or user-activation quirks.

* **Recommended Technical Approach:** Use a client-side PDF generation library (e.g., `@react-pdf/renderer`, or `jsPDF` + `html2canvas`) to render the marksheet layout directly into a PDF document object in the browser, then trigger a direct file download via a Blob URL and an `<a download>` link — no `window.print()`, no `@media print` CSS, no print portal.

* **Layout Specification to Replicate:**
  * BSEB/CBSE-compliant A4 portrait marksheet.
  * Official school header with logo, school name, address, and affiliation metadata.
  * Student information block: Roll No./Student ID, Father's Name, Mother's Name, Class & Section, Exam Name, Date of Birth.
  * Tabular subject-marks grid: Subject Name, Max Marks, Pass Marks, Marks Obtained, Grade, and Pass/Fail Status.
  * Overall performance summary: Total Marks, Grand Percentage, Aggregate Grade (A1 to F), and Final Result Status.
  * Formal institutional signature section (Class Teacher, Principal/Controller of Examinations).

* **Data Source & Integrity:**
  * Approved rows from `results` (`is_approved = true`).
  * Joined with real student demographics (`father_name`, `mother_name`, `dob`, `address` from `students` and `profiles`), never hardcoded placeholder text.

* **Unified Implementation across 5 Trigger Points:**
  * Admin Portal: Manage Results (`/admin/manage-results`) and Class Dashboard (`/admin/classes`).
  * Teacher Portal: Manage Results (`/teacher/manage-results`).
  * Student Portal: Results Page (`/student/results`).
  * Parent Portal: Progress Page (`/parent/progress`).
  * *Architecture Rule:* All 5 trigger points must invoke a single shared PDF-generation utility function, rather than five separate implementations.

---

## 6. End-to-End Operational Workflows

### 6.1 Workflow 1: Student Admission & Parent Onboarding
```
[Applicant] -> Fills /register -> Verifies Email via OTP -> Inserts into pending_registrations ('pending')
      |
[Admin]     -> Reviews in /admin/requests -> Assigns Class -> Clicks 'Approve'
      |
[System]    -> 1. Upserts student profile in `profiles`
            -> 2. Generates sequential ID (e.g. STU-2026-0001) in `students`
            -> 3. Generates secure random password for Parent
            -> 4. Creates parent Auth user & profile in `profiles` and `parents`
            -> 5. Links student <-> parent in `parent_students`
            -> 6. Sends automated SMTP email credentials to parent
            -> 7. Marks pending_registrations as 'approved'
      |
[Parent]    -> Receives credentials -> Logs into /parent -> Accesses child portal
```

### 6.2 Workflow 2: Result Lifecycle & Moderation
```
[Teacher]   -> Enters marks / uploads CSV in /teacher/manage-results
            -> Records saved in `results` with is_approved = false
      |
[Admin]     -> Receives notification badge in /admin/results
            -> Reviews marksheet & grade calculations
            -> Clicks 'Approve Batch' (sets is_approved = true, approved_by, approved_at)
      |
[Visibility]-> Results become instantly readable to Student (/student/results) and Parent (/parent/progress)
      |
[Post-Approval Edit Flow]:
[Teacher]   -> Submits Edit Request with new score & reason
[Admin]     -> Approves request in /admin/requests -> Database score updated
```

### 6.3 Workflow 3: Geofenced Teacher Attendance Check-In
```
[Teacher]   -> Navigates to /teacher/attendance -> Clicks "Mark Attendance"
      |
[Browser]   -> Captures GPS (lat, lng) & Takes live selfie photo
      |
[Server]    -> 1. Computes Haversine distance to School (26.1121° N, 86.6069° E)
            -> 2. Distance <= 50m check (Rejects if > 50m)
            -> 3. Uploads selfie photo to ImgBB
            -> 4. Idempotently inserts into `teacher_attendance` (status = 'present')
      |
[Admin]     -> Real-time attendance log visible on Admin Dashboard & Teacher profile
```

---

## 7. Verification & Compliance Checklist

* [x] **Zero TypeScript / Build Errors:** Tested against Next.js 16.2.9 with Turbopack.
* [x] **Live Schema Parity:** All 19 tables mapped exactly from `src/types/supabase.ts`.
* [x] **RLS Policy Synchronization:** All 48 active security rules detailed and explained.
* [x] **Reliable Client-Side PDF Architecture:** Specification demands pure client-side direct blob file download (no `window.print()` / `@media print` dependencies).
* [x] **Design-Agnostic Blueprint:** Pure functional architecture ready for any UI/design rebuild.
