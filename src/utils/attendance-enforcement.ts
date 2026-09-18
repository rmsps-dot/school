import { supabaseAdmin } from '@/utils/supabase/admin'

export interface AttendanceEnforcementResult {
  istDate: string
  istTime: string
  teacherWindowEnd: string
  studentWindowEnd: string
  teacherEnforced: number
  studentEnforced: number
  pastDaysEnforced: number
  error?: string
}

/**
 * Enforces attendance rules for today (and any unclosed past days):
 * 1. Fetches attendance windows from the settings table.
 * 2. Compares Indian Standard Time (IST, Asia/Kolkata) with window end times.
 * 3. Once the window end time has passed, any teacher or student without an
 *    attendance record for today is automatically marked as 'absent'.
 * 4. Also closes any un-marked attendance records for yesterday as 'absent'.
 */
export async function enforceAttendanceRules(): Promise<AttendanceEnforcementResult> {
  const now = new Date()

  // Format today's date & time in Indian Standard Time (IST)
  const istDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now) // 'YYYY-MM-DD'
  const istTime = now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) // 'HH:MM'

  const result: AttendanceEnforcementResult = {
    istDate,
    istTime,
    teacherWindowEnd: '18:00',
    studentWindowEnd: '18:00',
    teacherEnforced: 0,
    studentEnforced: 0,
    pastDaysEnforced: 0,
  }

  try {
    // 1. Fetch configured window settings from database
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .in('key', ['student_attendance_window', 'teacher_attendance_window', 'teacher_attendance_setting'])

    let studentEnd = '18:00'
    let teacherEnd = '18:00'

    if (settings && settings.length > 0) {
      for (const s of settings) {
        if (s.key === 'student_attendance_window' && s.value) {
          const val = s.value as { end?: string }
          if (val.end) studentEnd = val.end
        }
        if (s.key === 'teacher_attendance_window' && s.value) {
          const val = s.value as { end?: string }
          if (val.end) teacherEnd = val.end
        }
        if (s.key === 'teacher_attendance_setting' && s.value) {
          const val = s.value as { end_time?: string }
          if (val.end_time) teacherEnd = val.end_time
        }
      }
    }

    result.teacherWindowEnd = teacherEnd
    result.studentWindowEnd = studentEnd

    // 2. Teacher Attendance Enforcement for TODAY (if past window)
    if (istTime >= teacherEnd) {
      const { data: allTeachers } = await supabaseAdmin.from('teachers').select('id')
      const { data: markedTeachers } = await supabaseAdmin
        .from('teacher_attendance')
        .select('teacher_id')
        .eq('date', istDate)

      if (allTeachers && markedTeachers) {
        const markedTeacherIds = new Set(markedTeachers.map((t) => t.teacher_id))
        const unmarkedTeachers = allTeachers.filter((t) => !markedTeacherIds.has(t.id))

        if (unmarkedTeachers.length > 0) {
          const absentRecords = unmarkedTeachers.map((t) => ({
            teacher_id: t.id,
            date: istDate,
            status: 'absent' as const,
            photo_url: null,
            location_lat: null,
            location_lng: null,
          }))

          const { error: tErr } = await supabaseAdmin
            .from('teacher_attendance')
            .upsert(absentRecords, { onConflict: 'teacher_id,date', ignoreDuplicates: true })

          if (tErr) {
            console.error('[attendance-enforcement] Failed to mark teachers absent:', tErr.message)
          } else {
            result.teacherEnforced = unmarkedTeachers.length
          }
        }
      }
    }

    // 3. Student Attendance Enforcement for TODAY (if past window)
    if (istTime >= studentEnd) {
      const { data: allStudents } = await supabaseAdmin.from('students').select('id, class_id')
      const { data: markedStudents } = await supabaseAdmin
        .from('student_attendance')
        .select('student_id')
        .eq('date', istDate)

      if (allStudents && markedStudents) {
        const markedStudentIds = new Set(markedStudents.map((s) => s.student_id))
        const unmarkedStudents = allStudents.filter((s) => !markedStudentIds.has(s.id))

        if (unmarkedStudents.length > 0) {
          const absentRecords = unmarkedStudents.map((s) => ({
            student_id: s.id,
            class_id: s.class_id,
            date: istDate,
            status: 'absent' as const,
            marked_by: null,
          }))

          const { error: sErr } = await supabaseAdmin
            .from('student_attendance')
            .upsert(absentRecords, { onConflict: 'student_id,date', ignoreDuplicates: true })

          if (sErr) {
            console.error('[attendance-enforcement] Failed to mark students absent:', sErr.message)
          } else {
            result.studentEnforced = unmarkedStudents.length
          }
        }
      }
    }

    // 4. Sweep YESTERDAY'S attendance (in case yesterday was not closed)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(yesterday)

    const { data: yStudents } = await supabaseAdmin.from('students').select('id, class_id')
    const { data: markedYStudents } = await supabaseAdmin
      .from('student_attendance')
      .select('student_id')
      .eq('date', yesterdayDate)

    if (yStudents && markedYStudents) {
      const markedYIds = new Set(markedYStudents.map((s) => s.student_id))
      const unmarkedYStudents = yStudents.filter((s) => !markedYIds.has(s.id))

      if (unmarkedYStudents.length > 0) {
        const yAbsentRecords = unmarkedYStudents.map((s) => ({
          student_id: s.id,
          class_id: s.class_id,
          date: yesterdayDate,
          status: 'absent' as const,
          marked_by: null,
        }))

        await supabaseAdmin
          .from('student_attendance')
          .upsert(yAbsentRecords, { onConflict: 'student_id,date', ignoreDuplicates: true })

        result.pastDaysEnforced += unmarkedYStudents.length
      }
    }

    const { data: yTeachers } = await supabaseAdmin.from('teachers').select('id')
    const { data: markedYTeachers } = await supabaseAdmin
      .from('teacher_attendance')
      .select('teacher_id')
      .eq('date', yesterdayDate)

    if (yTeachers && markedYTeachers) {
      const markedYTIds = new Set(markedYTeachers.map((t) => t.teacher_id))
      const unmarkedYTeachers = yTeachers.filter((t) => !markedYTIds.has(t.id))

      if (unmarkedYTeachers.length > 0) {
        const yAbsentTeacherRecords = unmarkedYTeachers.map((t) => ({
          teacher_id: t.id,
          date: yesterdayDate,
          status: 'absent' as const,
          photo_url: null,
          location_lat: null,
          location_lng: null,
        }))

        await supabaseAdmin
          .from('teacher_attendance')
          .upsert(yAbsentTeacherRecords, { onConflict: 'teacher_id,date', ignoreDuplicates: true })

        result.pastDaysEnforced += unmarkedYTeachers.length
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown enforcement error'
    console.error('[attendance-enforcement] Execution error:', message)
    result.error = message
  }

  return result
}
