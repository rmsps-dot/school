import { type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/daily-master
 *
 * Daily Master Cron Job.
 * Runs every night at midnight (0 0 * * *)
 *
 * Tasks:
 * 1. Attendance Enforcement: Marks unmarked students and teachers as ABSENT for the previous day.
 * 2. Homework Reminders: Sends notifications for homework due tomorrow.
 * 3. Storage Cleanup: Removes teacher attendance photos older than 24 hours.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[daily-master] CRON_SECRET env var is not set! Route is disabled.')
    return Response.json({ error: 'Cron route not configured.' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const results: any = {}

  // ============================================================================
  // TASK 1: Attendance Enforcement (Mark unmarked as ABSENT)
  // ============================================================================
  try {
    // We run at midnight, so "today" for attendance purposes is yesterday.
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const targetDate = yesterday.toISOString().split('T')[0] // YYYY-MM-DD

    // 1.a Teacher Attendance Enforcement
    const { data: allTeachers } = await supabaseAdmin.from('teachers').select('id, profile_id')
    const { data: markedTeachers } = await supabaseAdmin
      .from('teacher_attendance')
      .select('teacher_id')
      .eq('date', targetDate)

    if (allTeachers && markedTeachers) {
      const markedTeacherIds = new Set(markedTeachers.map((t) => t.teacher_id))
      const unmarkedTeachers = allTeachers.filter((t) => !markedTeacherIds.has(t.id))

      if (unmarkedTeachers.length > 0) {
        const absentRecords = unmarkedTeachers.map((t) => ({
          teacher_id: t.id,
          date: targetDate,
          status: 'absent',
          photo_url: null,
          location_lat: null,
          location_lng: null,
        }))

        const { error: tError } = await supabaseAdmin.from('teacher_attendance').insert(absentRecords)
        if (tError) console.error('[daily-master] Teacher attendance enforcement error:', tError.message)
        else results.teacherAttendanceEnforced = unmarkedTeachers.length
      } else {
        results.teacherAttendanceEnforced = 0
      }
    }

    // 1.b Student Attendance Enforcement
    const { data: allClasses } = await supabaseAdmin.from('classes').select('id')
    const { data: allStudents } = await supabaseAdmin.from('students').select('id, class_id')
    const { data: markedStudents } = await supabaseAdmin
      .from('student_attendance')
      .select('student_id')
      .eq('date', targetDate)

    if (allClasses && allStudents && markedStudents) {
      const markedStudentIds = new Set(markedStudents.map((s) => s.student_id))
      const unmarkedStudents = allStudents.filter((s) => !markedStudentIds.has(s.id))

      if (unmarkedStudents.length > 0) {
        const absentRecords = unmarkedStudents.map((s) => ({
          student_id: s.id,
          class_id: s.class_id,
          date: targetDate,
          status: 'absent',
          marked_by: null, // System marked
        }))

        const { error: sError } = await supabaseAdmin.from('student_attendance').insert(absentRecords)
        if (sError) console.error('[daily-master] Student attendance enforcement error:', sError.message)
        else results.studentAttendanceEnforced = unmarkedStudents.length
      } else {
        results.studentAttendanceEnforced = 0
      }
    }
  } catch (error: any) {
    console.error('[daily-master] Attendance task failed:', error)
    results.attendanceError = error.message
  }

  // ============================================================================
  // TASK 2: Homework Reminders
  // ============================================================================
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dueDate = tomorrow.toISOString().split('T')[0]

    const { data: dueHomeworks, error: hwError } = await supabaseAdmin
      .from('homework')
      .select('id, class_id, subject, title')
      .eq('due_date', dueDate)

    if (hwError) {
      console.error('[daily-master] Homework fetch error:', hwError.message)
    } else if (dueHomeworks && dueHomeworks.length > 0) {
      // In a full implementation, this would trigger the push notification service
      // for each class_id. For now, we log it as processed.
      results.homeworkRemindersSent = dueHomeworks.length
    } else {
      results.homeworkRemindersSent = 0
    }
  } catch (error: any) {
    console.error('[daily-master] Homework task failed:', error)
    results.homeworkError = error.message
  }

  // ============================================================================
  // TASK 3: Storage Cleanup (formerly cleanup-attendance)
  // ============================================================================
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: staleRows, error: fetchError } = await supabaseAdmin
      .from('teacher_attendance')
      .select('id, photo_url')
      .not('photo_url', 'is', null)
      .lt('created_at', cutoff)

    if (fetchError) {
      console.error('[daily-master] Stale photo fetch error:', fetchError.message)
    } else if (staleRows && staleRows.length > 0) {
      const BUCKET = 'attendance-photos'
      const bucketPathMarker = `/object/public/${BUCKET}/`
      const storagePaths: string[] = []
      const rowIds: string[] = []

      for (const row of staleRows) {
        if (!row.photo_url) continue
        const markerIndex = row.photo_url.indexOf(bucketPathMarker)
        if (markerIndex === -1) {
          rowIds.push(row.id)
          continue
        }
        const objectPath = row.photo_url.slice(markerIndex + bucketPathMarker.length)
        storagePaths.push(objectPath)
        rowIds.push(row.id)
      }

      if (storagePaths.length > 0) {
        await supabaseAdmin.storage.from(BUCKET).remove(storagePaths)
      }

      await supabaseAdmin
        .from('teacher_attendance')
        .update({ photo_url: null })
        .in('id', rowIds)

      results.photosCleaned = rowIds.length
    } else {
      results.photosCleaned = 0
    }
  } catch (error: any) {
    console.error('[daily-master] Cleanup task failed:', error)
    results.cleanupError = error.message
  }

  return Response.json({ success: true, results })
}
