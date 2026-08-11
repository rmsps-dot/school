'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Save, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { updateSetting, type AppSetting } from '@/actions/settings-actions'

interface SettingsClientProps {
  initialSettings: AppSetting[]
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const attendanceWindowSetting = initialSettings.find(s => s.key === 'teacher_attendance_window')
  const defaultTimes = (attendanceWindowSetting?.value as { start: string, end: string }) || { start: '06:00', end: '12:00' }

  const [startTime, setStartTime] = useState(defaultTimes.start)
  const [endTime, setEndTime] = useState(defaultTimes.end)
  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSaveAttendanceWindow = () => {
    setErrorMsg('')
    setSuccessMsg('')
    startTransition(async () => {
      const res = await updateSetting('teacher_attendance_window', { start: startTime, end: endTime })
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Attendance window updated successfully.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  const timeInputClass = "w-full input-glass rounded-xl px-4 py-3 text-parchment focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all text-sm"

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card rounded-2xl border border-hairline overflow-hidden"
      >
        <div className="p-6 border-b border-hairline">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-veena-blue/30"
              style={{ background: 'rgba(62,92,118,0.12)' }}>
              <Clock className="w-5 h-5 text-veena-blue" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-parchment">Teacher Attendance Window</h2>
              <p className="text-sm text-mist">Set the allowed time limits for teachers to mark student attendance.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist uppercase tracking-wider">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={timeInputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-mist uppercase tracking-wider">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={timeInputClass}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">{errorMsg}</div>
          )}

          {successMsg && (
            <div className="text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSaveAttendanceWindow}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-ink transition-all hover:scale-[1.01] disabled:opacity-50"
              style={{ background: 'var(--coral)' }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
