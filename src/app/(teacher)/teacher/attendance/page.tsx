import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getTodayAttendance } from '@/actions/teacher-actions'
import { getTeacherAttendanceSetting } from '@/actions/settings-actions'
import MarkAttendance from '@/components/teacher/MarkAttendance'
import { Camera } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch today's status for this teacher and active geofence settings
  const [{ marked, record, error }, { data: geofenceSetting }] = await Promise.all([
    getTodayAttendance(),
    getTeacherAttendanceSetting(),
  ])

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Page header */}
      <div className="surface-card rounded-3xl p-8 flex items-center gap-6 shadow-xl border-hairline">
        <div className="w-14 h-14 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner">
          <Camera className="w-6 h-6 text-veena-blue" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-parchment">Mark Attendance</h1>
          <p className="text-mist font-mono uppercase tracking-widest text-[10px] mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {error && (
        <div className="surface-card rounded-2xl px-6 py-4 text-sm text-red-400 border border-red-500/20 font-mono shadow-lg">
          <span className="mr-2">⚠</span> {error}
        </div>
      )}

      <MarkAttendance
        alreadyMarked={marked}
        record={record}
        teacherProfileId={user.id}
        geofenceSetting={geofenceSetting}
      />
    </div>
  )
}
