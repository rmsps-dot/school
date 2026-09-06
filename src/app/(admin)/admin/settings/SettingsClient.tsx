'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Clock, Loader2, CheckCircle2, MapPin, Trash2, Users, Shield } from 'lucide-react'
import { updateSetting, type AppSetting, type TeacherAttendanceSetting } from '@/actions/settings-actions'
import LocationMapPicker from '@/components/admin/LocationMapPicker'

interface SettingsClientProps {
  initialSettings: AppSetting[]
}

type SettingsTab = 'teacher' | 'student'

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('teacher')

  // ── 1. Teacher Attendance & Geofence Setting ──
  const teacherSettingRaw = initialSettings.find(s => s.key === 'teacher_attendance_setting')?.value as Partial<TeacherAttendanceSetting> | undefined
  const defaultTeacherSetting: TeacherAttendanceSetting = {
    start_time: typeof teacherSettingRaw?.start_time === 'string' ? teacherSettingRaw.start_time : '06:00',
    end_time: typeof teacherSettingRaw?.end_time === 'string' ? teacherSettingRaw.end_time : '09:30',
    location_name: typeof teacherSettingRaw?.location_name === 'string' ? teacherSettingRaw.location_name : 'RMSPS Main Campus',
    lat: typeof teacherSettingRaw?.lat === 'number' ? teacherSettingRaw.lat : null,
    lng: typeof teacherSettingRaw?.lng === 'number' ? teacherSettingRaw.lng : null,
    radius_meters: typeof teacherSettingRaw?.radius_meters === 'number' ? teacherSettingRaw.radius_meters : 50,
  }

  const [teacherStartTime, setTeacherStartTime] = useState(defaultTeacherSetting.start_time)
  const [teacherEndTime, setTeacherEndTime] = useState(defaultTeacherSetting.end_time)
  const [locationName, setLocationName] = useState(defaultTeacherSetting.location_name)
  const [teacherLat, setTeacherLat] = useState<number | null>(defaultTeacherSetting.lat)
  const [teacherLng, setTeacherLng] = useState<number | null>(defaultTeacherSetting.lng)
  const [teacherRadius, setTeacherRadius] = useState<number>(defaultTeacherSetting.radius_meters)

  const [isTeacherPending, startTeacherTransition] = useTransition()
  const [teacherSuccessMsg, setTeacherSuccessMsg] = useState('')
  const [teacherErrorMsg, setTeacherErrorMsg] = useState('')

  // ── 2. Student Attendance Window Setting (Renamed) ──
  const studentWindowSetting = initialSettings.find(s => s.key === 'student_attendance_window' || s.key === 'teacher_attendance_window')
  const defaultStudentTimes = (studentWindowSetting?.value as { start: string, end: string }) || { start: '06:00', end: '12:00' }

  const [studentStartTime, setStudentStartTime] = useState(defaultStudentTimes.start)
  const [studentEndTime, setStudentEndTime] = useState(defaultStudentTimes.end)
  const [isStudentPending, startStudentTransition] = useTransition()
  const [studentSuccessMsg, setStudentSuccessMsg] = useState('')
  const [studentErrorMsg, setStudentErrorMsg] = useState('')

  const handleSaveTeacherSettings = () => {
    setTeacherErrorMsg('')
    setTeacherSuccessMsg('')
    startTeacherTransition(async () => {
      const payload: TeacherAttendanceSetting = {
        start_time: teacherStartTime,
        end_time: teacherEndTime,
        location_name: locationName.trim(),
        lat: teacherLat,
        lng: teacherLng,
        radius_meters: teacherRadius,
      }

      const res = await updateSetting('teacher_attendance_setting', payload)
      if (res.error) {
        setTeacherErrorMsg(res.error)
      } else {
        setTeacherSuccessMsg('Teacher attendance settings and geofence updated successfully!')
      }
    })
  }

  const handleSaveStudentAttendanceWindow = () => {
    setStudentErrorMsg('')
    setStudentSuccessMsg('')
    startStudentTransition(async () => {
      const payload = { start: studentStartTime, end: studentEndTime }
      // Update both keys for backward-compatibility
      await updateSetting('teacher_attendance_window', payload)
      const res = await updateSetting('student_attendance_window', payload)
      if (res.error) {
        setStudentErrorMsg(res.error)
      } else {
        setStudentSuccessMsg('Student attendance window updated successfully!')
      }
    })
  }

  const handleSelectLocation = (lat: number, lng: number, address?: string) => {
    setTeacherLat(lat)
    setTeacherLng(lng)
    if (address && !locationName) {
      setLocationName(address)
    }
  }

  const handleClearLocation = () => {
    setTeacherLat(null)
    setTeacherLng(null)
  }

  const timeInputClass = "w-full input-glass rounded-xl px-4 py-3 text-parchment focus:outline-none focus:border-coral/60 focus:ring-1 focus:ring-coral/20 transition-all text-sm font-mono"

  return (
    <div className="space-y-6">
      
      {/* ── Top Section-Wise Tabs Switcher ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-ink border border-hairline max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab('teacher')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'teacher'
              ? 'bg-coral text-ink shadow-lg'
              : 'text-mist hover:text-parchment hover:bg-white/5'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Teacher Attendance & Geofence</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('student')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'student'
              ? 'bg-veena-blue text-ink shadow-lg'
              : 'text-mist hover:text-parchment hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Attendance Window</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ─────────────────────────────────────────────────────────────
            TAB 1: TEACHER ATTENDANCE & GEOFENCE LOCATION
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'teacher' && (
          <motion.div
            key="tab-teacher"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-panel rounded-3xl border border-hairline overflow-hidden space-y-8"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-hairline bg-ink/30">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-coral/10 border border-coral/30 flex items-center justify-center text-coral">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-parchment">Teacher Geofence & Check-In Window</h2>
                  <p className="text-xs md:text-sm text-mist mt-1">
                    Control GPS geofence boundary and allowed morning hours for teachers to check in.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* Timing settings */}
              <div>
                <h3 className="text-sm font-bold text-parchment uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-coral" /> Daily Check-In Time Limits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider">Start Time</label>
                    <input
                      type="time"
                      value={teacherStartTime}
                      onChange={(e) => setTeacherStartTime(e.target.value)}
                      className={timeInputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider">End Time</label>
                    <input
                      type="time"
                      value={teacherEndTime}
                      onChange={(e) => setTeacherEndTime(e.target.value)}
                      className={timeInputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Location details */}
              <div className="border-t border-hairline pt-6">
                <h3 className="text-sm font-bold text-parchment uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-coral" /> Campus Geofence Boundary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mb-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider">Campus / Location Name</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. RMSPS Main Campus"
                      className="w-full input-glass rounded-xl px-4 py-3 text-parchment text-sm focus:outline-none focus:border-coral/60 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider">Allowed Radius (Meters)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="10"
                        max="2000"
                        step="10"
                        value={teacherRadius}
                        onChange={(e) => setTeacherRadius(Number(e.target.value) || 50)}
                        className={timeInputClass}
                      />
                      <span className="text-xs text-mist font-mono shrink-0">meters</span>
                    </div>
                  </div>
                </div>

                {/* Map Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider flex items-center justify-between">
                    <span>Pin Campus Center on Interactive Map</span>
                    {teacherLat && teacherLng && (
                      <button
                        type="button"
                        onClick={handleClearLocation}
                        className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear Pin
                      </button>
                    )}
                  </label>
                  <LocationMapPicker
                    lat={teacherLat}
                    lng={teacherLng}
                    radiusMeters={teacherRadius}
                    locationName={locationName}
                    onChange={({ lat, lng, radiusMeters, locationName: newName }) => {
                      setTeacherLat(lat)
                      setTeacherLng(lng)
                      setTeacherRadius(radiusMeters)
                      if (newName) setLocationName(newName)
                    }}
                  />
                  {teacherLat && teacherLng ? (
                    <p className="text-xs text-emerald-400 font-mono mt-2">
                      Coordinates Set: {teacherLat.toFixed(6)}, {teacherLng.toFixed(6)} (Radius: {teacherRadius}m)
                    </p>
                  ) : (
                    <p className="text-xs text-amber-400 font-mono mt-2">
                      No coordinates selected. Geofencing check will be disabled for teachers until set.
                    </p>
                  )}
                </div>
              </div>

              {teacherErrorMsg && (
                <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-mono">
                  {teacherErrorMsg}
                </div>
              )}

              {teacherSuccessMsg && (
                <div className="text-emerald-400 text-xs bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> {teacherSuccessMsg}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleSaveTeacherSettings}
                  disabled={isTeacherPending}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-ink bg-coral hover:bg-coral/90 transition-all disabled:opacity-50 shadow-lg"
                >
                  {isTeacherPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Teacher Geofence
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: STUDENT ATTENDANCE WINDOW
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'student' && (
          <motion.div
            key="tab-student"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-panel rounded-3xl border border-hairline overflow-hidden space-y-6"
          >
            <div className="p-6 md:p-8 border-b border-hairline bg-ink/30">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center text-veena-blue">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-parchment">Student Class Attendance Window</h2>
                  <p className="text-xs md:text-sm text-mist mt-1">
                    Set the allowed time limits for teachers to mark student attendance in their assigned classes.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider">Allowed Start Time</label>
                  <input
                    type="time"
                    value={studentStartTime}
                    onChange={(e) => setStudentStartTime(e.target.value)}
                    className={timeInputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider">Allowed End Time</label>
                  <input
                    type="time"
                    value={studentEndTime}
                    onChange={(e) => setStudentEndTime(e.target.value)}
                    className={timeInputClass}
                  />
                </div>
              </div>

              {studentErrorMsg && (
                <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-mono">
                  {studentErrorMsg}
                </div>
              )}

              {studentSuccessMsg && (
                <div className="text-emerald-400 text-xs bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> {studentSuccessMsg}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleSaveStudentAttendanceWindow}
                  disabled={isStudentPending}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-ink bg-veena-blue hover:bg-veena-blue/90 transition-all disabled:opacity-50 shadow-lg"
                >
                  {isStudentPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Student Window
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
