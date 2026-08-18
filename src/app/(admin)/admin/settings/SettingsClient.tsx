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
        setTeacherSuccessMsg('Teacher attendance window & geofence location saved successfully.')
        setTimeout(() => setTeacherSuccessMsg(''), 4000)
      }
    })
  }

  const handleClearLocation = () => {
    if (confirm('Are you sure you want to remove the school location and radius? Teachers will not be able to mark attendance until a location is configured.')) {
      setTeacherLat(null)
      setTeacherLng(null)
      setLocationName('')
    }
  }

  const handleSaveStudentAttendanceWindow = () => {
    setStudentErrorMsg('')
    setStudentSuccessMsg('')
    startStudentTransition(async () => {
      const res1 = await updateSetting('student_attendance_window', { start: studentStartTime, end: studentEndTime })
      const res2 = await updateSetting('teacher_attendance_window', { start: studentStartTime, end: studentEndTime })

      if (res1.error || res2.error) {
        setStudentErrorMsg(res1.error || res2.error || 'Failed to save student attendance window.')
      } else {
        setStudentSuccessMsg('Student attendance window updated successfully.')
        setTimeout(() => setStudentSuccessMsg(''), 3000)
      }
    })
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
            className="surface-card rounded-3xl border border-hairline overflow-hidden shadow-2xl"
          >
            <div className="p-6 md:p-8 border-b border-hairline bg-gradient-to-r from-coral/10 via-transparent to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-coral/30 bg-coral/10 text-coral flex-shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-parchment">Teacher Attendance & Geofence</h2>
                    <p className="text-xs md:text-sm text-mist mt-1">
                      Set daily check-in window and configure school gate GPS radius for faculty selfies.
                    </p>
                  </div>
                </div>
                {teacherLat !== null && teacherLng !== null ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active Geofence
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold self-start sm:self-auto">
                    <Shield className="w-3.5 h-3.5" />
                    Location Not Set
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              
              {/* Time Window */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-veena-blue" />
                  <h3 className="text-xs font-bold text-parchment uppercase tracking-wider">
                    1. Daily Teacher Attendance Time Window
                  </h3>
                </div>
                <p className="text-xs text-mist">
                  Teachers cannot mark photo attendance outside this timeframe.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider">Allowed Start Time</label>
                    <input
                      type="time"
                      value={teacherStartTime}
                      onChange={(e) => setTeacherStartTime(e.target.value)}
                      className={timeInputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider">Allowed End Time</label>
                    <input
                      type="time"
                      value={teacherEndTime}
                      onChange={(e) => setTeacherEndTime(e.target.value)}
                      className={timeInputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Location Name & Map Picker */}
              <div className="space-y-4 pt-6 border-t border-hairline">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-coral" />
                    <h3 className="text-xs font-bold text-parchment uppercase tracking-wider">
                      2. School Location & Geofence Radius
                    </h3>
                  </div>
                  {teacherLat !== null && (
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Location
                    </button>
                  )}
                </div>

                <div className="max-w-xl space-y-1.5">
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider">School / Campus Name</label>
                  <input
                    type="text"
                    placeholder="e.g. RMSPS Main Campus, Bihar"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full input-glass rounded-xl px-4 py-2.5 text-xs text-parchment focus:outline-none focus:border-coral transition-colors"
                  />
                </div>

                {/* Interactive Map & Google Maps URL Parser */}
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
              </div>

              {/* Teacher Section Feedback */}
              {teacherErrorMsg && (
                <div className="text-red-400 text-xs bg-red-500/10 p-4 rounded-xl border border-red-500/20 font-mono">
                  {teacherErrorMsg}
                </div>
              )}

              {teacherSuccessMsg && (
                <div className="text-emerald-400 text-xs bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> {teacherSuccessMsg}
                </div>
              )}

              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={handleSaveTeacherSettings}
                  disabled={isTeacherPending}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-ink transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-lg"
                  style={{ background: 'var(--coral)' }}
                >
                  {isTeacherPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Teacher Attendance Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: STUDENT ATTENDANCE WINDOW (RENAMED)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'student' && (
          <motion.div
            key="tab-student"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="surface-card rounded-3xl border border-hairline overflow-hidden shadow-2xl"
          >
            <div className="p-6 md:p-8 border-b border-hairline bg-gradient-to-r from-veena-blue/10 via-transparent to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-veena-blue/30 bg-veena-blue/10 text-veena-blue flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-parchment">Student Attendance Window</h2>
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
