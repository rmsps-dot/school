'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react'
import { getStudentsByClass } from '@/actions/class-actions'
import type { StudentViewRecord } from '@/actions/class-actions'
import { getStudentAttendance, markStudentAttendance } from '@/actions/attendance-actions'
import type { ClassWithSubject } from '@/actions/result-actions'
import DateInput from '@/components/shared/DateInput'

interface Props {
  classes: ClassWithSubject[]
  timeWindow: { start: string, end: string }
}

import type { Database } from '@/types/supabase'

export default function ClassAttendanceClient({ classes, timeWindow }: Props) {
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<StudentViewRecord[]>([])
  const [attendance, setAttendance] = useState<Record<string, Database['public']['Enums']['attendance_status']>>({})
  
  const [isPending, startTransition] = useTransition()
  const [loadingData, setLoadingData] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Check if current time is within window
  const isTimeAllowed = () => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return currentTime >= timeWindow.start && currentTime <= timeWindow.end
  }

  // Check if selected date is today
  const isToday = () => {
    const today = new Date().toISOString().split('T')[0]
    return selectedDate === today
  }

  const canEdit = isToday() && isTimeAllowed()

  useEffect(() => {
    if (selectedDate && selectedClass) {
      const updateStates = () => {
        setErrorMsg('')
        setSuccessMsg('')
        setLoadingData(true)
      }
      updateStates()
      
      Promise.all([
        getStudentsByClass(selectedClass),
        getStudentAttendance(selectedClass, selectedDate)
      ]).then(([studentsRes, attRes]) => {
        setLoadingData(false)
        if (studentsRes.data) setStudents(studentsRes.data)
        
        if (attRes.data) {
          const attMap: Record<string, Database['public']['Enums']['attendance_status']> = {}
          attRes.data.forEach((a: { student_id: string; status: Database['public']['Enums']['attendance_status'] }) => {
            attMap[a.student_id] = a.status
          })
          setAttendance(attMap)
        } else {
          setAttendance({})
        }
      })
    }
  }, [selectedClass, selectedDate])

  const handleMark = (studentId: string, status: Database['public']['Enums']['attendance_status']) => {
    if (!canEdit) return
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const handleSave = () => {
    if (!canEdit) {
      setErrorMsg("You can only update attendance for today within the allowed time window.")
      return
    }

    setErrorMsg('')
    setSuccessMsg('')

    const records = students.map(s => ({
      student_id: s.id,
      class_id: s.class_id || selectedClass,
      date: selectedDate,
      status: attendance[s.id] || 'absent' // default absent if not explicitly marked
    }))

    startTransition(async () => {
      const res = await markStudentAttendance(records)
      if (res.error) setErrorMsg(res.error)
      else setSuccessMsg('Attendance saved successfully.')
    })
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="surface-card p-4 rounded-2xl border border-hairline flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-64">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-ink/50 border border-hairline rounded-xl px-4 py-2.5 text-parchment focus:outline-none focus:border-coral transition-colors"
          >
            <option value="">Select a Class</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>
                {c.className} - {c.section}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-64">
          <DateInput
            value={selectedDate}
            onChange={setSelectedDate}
            label=""
            labelClass="hidden"
            className="[&>div:first-child]:hidden"
          />
        </div>
      </div>

      {!canEdit && selectedClass && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            {!isToday() 
              ? "You are viewing a past date. Attendance cannot be edited for past dates." 
              : `Attendance can only be marked between ${timeWindow.start} and ${timeWindow.end}.`}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Content */}
      <div className="min-h-[400px]">
        {loadingData ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-coral" />
          </div>
        ) : students.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-mist">
            <p>No students found for this class.</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-card rounded-2xl border border-hairline overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline bg-white/[0.02]">
                    <th className="p-4 text-sm font-semibold text-mist">Student Name</th>
                    <th className="p-4 text-sm font-semibold text-mist">Roll No / ID</th>
                    <th className="p-4 text-sm font-semibold text-mist text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b border-hairline hover:bg-white/[0.04]">
                      <td className="p-4 font-medium text-parchment flex items-center gap-3">
                        {s.profiles?.profile_photo_url ? (
                           <div className="w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0">
                             <Image src={s.profiles.profile_photo_url} alt={s.profiles.full_name || 'Student'} fill sizes="32px" className="object-cover" />
                           </div>
                        ) : (
                           <div className="w-8 h-8 rounded-full bg-coral/20" />
                        )}
                        {s.profiles?.full_name}
                      </td>
                      <td className="p-4 text-mist text-sm font-mono">{s.student_id}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={!canEdit}
                            onClick={() => handleMark(s.id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              attendance[s.id] === 'present' 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : 'bg-white/5 text-mist hover:bg-emerald-500/20 hover:text-emerald-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Present
                          </button>
                          <button
                            disabled={!canEdit}
                            onClick={() => handleMark(s.id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              (!attendance[s.id] || attendance[s.id] === 'absent')
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                                : 'bg-white/5 text-mist hover:bg-red-500/20 hover:text-red-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Absent
                          </button>
                          <button
                            disabled={!canEdit}
                            onClick={() => handleMark(s.id, 'leave')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              attendance[s.id] === 'leave' 
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                : 'bg-white/5 text-mist hover:bg-amber-500/20 hover:text-amber-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {canEdit && (
              <div className="p-4 border-t border-hairline bg-white/[0.02] flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-primary text-sm font-bold transition-all"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Attendance
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
