import { getClasses } from '@/actions/class-actions'
import { getSettings } from '@/actions/settings-actions'
import ClassAttendanceClient from './ClassAttendanceClient'

export const dynamic = 'force-dynamic'

export default async function ClassAttendancePage() {
  const classesRes = await getClasses()
  const allClasses = (classesRes.data || []).map(c => ({
    classId: c.id,
    className: c.class_name,
    section: c.section,
    subject: ''
  }))

  const { data: settings } = await getSettings()
  const windowSetting = (settings?.find(s => s.key === 'student_attendance_window' || s.key === 'teacher_attendance_window')?.value as { start: string, end: string }) || { start: '06:00', end: '12:00' }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Class Attendance</h1>
        <p className="text-mist">Mark student attendance for your assigned classes. Time Limit: {windowSetting.start} to {windowSetting.end}</p>
      </div>
      
      <ClassAttendanceClient classes={allClasses} timeWindow={windowSetting} />
    </div>
  )
}
