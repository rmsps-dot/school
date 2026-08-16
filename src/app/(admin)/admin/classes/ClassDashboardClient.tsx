'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Users, CalendarDays, Loader2, Save, ArrowRight, UserCircle, Plus, Trash2, Edit, AlertCircle, FileSpreadsheet, ListChecks, CheckSquare, ChevronDown, X } from 'lucide-react'
import React from 'react'
import { getStudentsByClass, getAdminClassAttendance, saveAdminClassAttendance, createClass, deleteClass, uploadStudentResult, getClassResults, deleteStudentResult, getManageAttendanceRecords, deleteAttendanceRecord, updateAttendanceRecordStatus, type SchoolClass } from '@/actions/class-actions'
import MarksheetModal from '@/components/admin/MarksheetModal'
import MarksheetTemplate from '@/components/admin/MarksheetTemplate'
import PrintPortal from '@/components/admin/PrintPortal'
import ResultUploadModal from '@/components/teacher/ResultUploadModal'
import { useRouter } from 'next/navigation'
import DateInput from '@/components/shared/DateInput'
import type { StudentMarksheet } from '@/actions/admin-result-actions'

type StudentType = Exclude<Awaited<ReturnType<typeof getStudentsByClass>>['data'], null>[number]
type AttendanceType = Exclude<Awaited<ReturnType<typeof getAdminClassAttendance>>['data'], null>[number]
type ManageAttendanceType = Exclude<Awaited<ReturnType<typeof getManageAttendanceRecords>>['data'], null>[number]
type ResultType = Exclude<Awaited<ReturnType<typeof getClassResults>>['data'], null>[number]
type GroupedResult = ResultType & { subjectsList: ResultType[], totalObtained: number, grandTotal: number }

interface ClassDashboardProps {
  classes: SchoolClass[]
}

export default function ClassDashboardClient({ classes: initialClasses }: ClassDashboardProps) {
  const router = useRouter()
  const [classes, setClasses] = useState(initialClasses)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'students' | 'mark_attendance' | 'manage_attendance' | 'upload_result' | 'manage_result'>('students')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Create Class State
  const [isCreating, setIsCreating] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newSection, setNewSection] = useState('')

  // Data states
  const [students, setStudents] = useState<StudentType[]>([])
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceType[]>([])
  const [isSavingAtt, setIsSavingAtt] = useState(false)
  const [manageAttendance, setManageAttendance] = useState<ManageAttendanceType[]>([])

  // Result Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // Manage Result State
  const [results, setResults] = useState<ResultType[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [editResult, setEditResult] = useState<ResultType | null>(null)
  const [printSheet, setPrintSheet] = useState<GroupedResult | null>(null)
  const [previewSheet, setPreviewSheet] = useState<GroupedResult | null>(null)

  useEffect(() => {
    if (!printSheet) return

    let cleanedUp = false
    const cleanup = () => {
      if (cleanedUp) return
      cleanedUp = true
      setPrintSheet(null)
    }

    const handleAfterPrint = () => {
      cleanup()
    }

    window.addEventListener('afterprint', handleAfterPrint)

    const timer = setTimeout(() => {
      try {
        window.print()
      } catch (err) {
        console.error('Print failed:', err)
        cleanup()
      }
    }, 250)

    const fallbackTimer = setTimeout(() => {
      cleanup()
    }, 10000)

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
      clearTimeout(timer)
      clearTimeout(fallbackTimer)
    }
  }, [printSheet])

  const mapGroupToMarksheet = (group: GroupedResult): StudentMarksheet => {
    const totalObtained = group.totalObtained
    const grandTotal = group.grandTotal
    const percentage = grandTotal > 0 ? (totalObtained / grandTotal) * 100 : 0
    
    // Calculate grade
    let grade = 'F'
    if (percentage >= 91) grade = 'A1'
    else if (percentage >= 81) grade = 'A2'
    else if (percentage >= 71) grade = 'B1'
    else if (percentage >= 61) grade = 'B2'
    else if (percentage >= 51) grade = 'C1'
    else if (percentage >= 41) grade = 'C2'
    else if (percentage >= 33) grade = 'D'

    return {
      studentRowId: group.student_id,
      studentCode: group.students?.student_id || 'N/A',
      studentName: group.students?.profiles?.full_name || 'N/A',
      fatherName: group.students?.father_name || null,
      motherName: group.students?.mother_name || null,
      dob: group.students?.profiles?.dob || null,
      address: group.students?.profiles?.address || null,
      classId: group.class_id,
      className: group.classes?.class_name || 'N/A',
      section: group.classes?.section || '-',
      examType: group.exam_type,
      teacherName: null,
      subjects: group.subjectsList.map((sub: ResultType) => ({
        id: sub.id,
        subject: sub.subject,
        marksObtained: sub.marks_obtained,
        totalMarks: sub.total_marks || sub.max_marks || 100,
        passingMarks: Math.ceil((sub.total_marks || sub.max_marks || 100) * 0.33),
      })),
      totalObtained,
      grandTotal,
      percentage,
      grade,
    }
  }

  // Fetch Data when class or tab/date changes
  useEffect(() => {
    if (activeTab === 'students') {
      startTransition(async () => {
        const { data } = await getStudentsByClass(selectedClass)
        if (data) setStudents(data)
      })
    } else if (activeTab === 'mark_attendance') {
      startTransition(async () => {
        const { data } = await getAdminClassAttendance(selectedClass, attendanceDate)
        if (data) setAttendanceRecords(data)
      })
    } else if (activeTab === 'manage_attendance') {
      startTransition(async () => {
        const { data } = await getManageAttendanceRecords(selectedClass)
        if (data) setManageAttendance(data)
      })
    } else if (activeTab === 'manage_result') {
      startTransition(async () => {
        const { data } = await getClassResults(selectedClass)
        if (data) setResults(data)
      })
    }
  }, [selectedClass, activeTab, attendanceDate])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const fd = new FormData()
      fd.append('className', newClassName)
      fd.append('section', newSection || '')
      const res = await createClass(fd)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  const handleDeleteClass = async () => {
    if (!selectedClass) return
    if (!confirm('Are you sure you want to delete this entire class?')) return
    setError('')
    startTransition(async () => {
      const res = await deleteClass(selectedClass)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  const handleSaveAttendance = async () => {
    if (attendanceRecords.length === 0) return
    setIsSavingAtt(true)
    const recordsToSave = attendanceRecords
      .filter(r => r.status)
      .map(r => ({ student_id: r.student_id, class_id: r.class_id, status: r.status }))
    
    await saveAdminClassAttendance(attendanceDate, recordsToSave)
    setIsSavingAtt(false)
    alert('Attendance saved successfully.')
  }

  const updateStatus = (studentId: string, status: string) => {
    setAttendanceRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r))
  }


  const handleDeleteResult = async (ids: string[]) => {
    if (!confirm('Are you sure you want to delete this entire result (all subjects)?')) return
    startTransition(async () => {
      await deleteStudentResult(ids)
      const { data } = await getClassResults(selectedClass)
      if (data) setResults(data)
    })
  }

  const handleDeleteAttendance = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return
    startTransition(async () => {
      await deleteAttendanceRecord(id)
      const { data } = await getManageAttendanceRecords(selectedClass)
      if (data) setManageAttendance(data)
    })
  }

  const handleUpdateManageAttendanceStatus = async (id: string, newStatus: string) => {
    startTransition(async () => {
      await updateAttendanceRecordStatus(id, newStatus as 'present' | 'absent' | 'leave')
      const { data } = await getManageAttendanceRecords(selectedClass)
      if (data) setManageAttendance(data)
    })
  }

  const selectedClassObj = classes.find(c => c.id === selectedClass)

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="surface-card rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-coral" /> Manage Classes
          </h1>
          <p className="text-mist mt-2 max-w-md">Select a class to manage its students, attendance, and results directory.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-64">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/50 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23e5e7eb' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: `right 1rem center`,
                backgroundRepeat: `no-repeat`,
                backgroundSize: `1.5em 1.5em`
              }}
            >
              <option value="">-- Select Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name} {c.section && c.section !== '-' ? `- Section ${c.section}` : ''}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setIsCreating(!isCreating); setError(''); }}
            className="bg-coral text-ink p-3 rounded-xl flex items-center justify-center shrink-0 hover:bg-[#E67E6B] transition-colors"
            title="Create New Class"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl flex items-center gap-3 text-sm font-mono"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="surface-card rounded-2xl p-6 border border-hairline shadow-xl"
          >
            <h2 className="font-display text-lg font-bold text-parchment mb-6">Create New Class</h2>
            <form onSubmit={handleCreateClass} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-mist uppercase tracking-wider">Class Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Class 10"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-mist uppercase tracking-wider">Section (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-coral text-ink py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#E67E6B] transition-colors h-[46px]"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Class'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="surface-card rounded-3xl border border-hairline overflow-hidden shadow-2xl">
        {/* Class Title and Actions */}
        <div className="px-8 py-6 border-b border-hairline flex justify-between items-center bg-surface">
          <h2 className="font-display text-2xl font-bold text-parchment">
            {selectedClass ? (
              <>{selectedClassObj?.class_name} <span className="text-coral">{selectedClassObj?.section && selectedClassObj.section !== '-' ? `Section ${selectedClassObj.section}` : ''}</span></>
            ) : (
              "All Classes"
            )}
          </h2>
          {selectedClass && (
            <button
              onClick={handleDeleteClass}
              disabled={isPending}
              className="text-mist hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
              title="Delete this class"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

          <div className="flex border-b border-hairline overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 min-w-[140px] flex justify-center items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'students' ? 'text-coral border-b-2 border-coral bg-ink' : 'text-mist hover:text-parchment hover:bg-ink/50'}`}
            >
              <Users className="w-4 h-4" /> Students
            </button>
            <button
              onClick={() => setActiveTab('mark_attendance')}
              className={`flex-1 min-w-[160px] flex justify-center items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'mark_attendance' ? 'text-coral border-b-2 border-coral bg-ink' : 'text-mist hover:text-parchment hover:bg-ink/50'}`}
            >
              <CalendarDays className="w-4 h-4" /> Mark Attendance
            </button>
            <button
              onClick={() => setActiveTab('manage_attendance')}
              className={`flex-1 min-w-[180px] flex justify-center items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'manage_attendance' ? 'text-coral border-b-2 border-coral bg-ink' : 'text-mist hover:text-parchment hover:bg-ink/50'}`}
            >
              <CheckSquare className="w-4 h-4" /> Manage Attendance
            </button>
            <button
              onClick={() => {
                if (!selectedClassObj) return alert('Please select a class from the dropdown first.')
                setUploadModalOpen(true)
              }}
              className={`flex-1 min-w-[160px] flex justify-center items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${uploadModalOpen ? 'text-coral border-b-2 border-coral bg-ink' : 'text-mist hover:text-parchment hover:bg-ink/50'}`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Upload Result
            </button>
            <button
              onClick={() => setActiveTab('manage_result')}
              className={`flex-1 min-w-[160px] flex justify-center items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'manage_result' ? 'text-coral border-b-2 border-coral bg-ink' : 'text-mist hover:text-parchment hover:bg-ink/50'}`}
            >
              <ListChecks className="w-4 h-4" /> Manage Results
            </button>
          </div>

          <div className="p-8 relative min-h-[400px]">
            {isPending && (
              <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-coral animate-spin" />
              </div>
            )}

            {/* TABS CONTENT */}
            {/* STUDENTS TAB */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                {students.length === 0 ? (
                  <div className="text-center py-16 text-mist font-mono uppercase tracking-widest text-sm">No students found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((s, i) => (
                      <div
                        key={s.id}
                        onClick={() => router.push(`/admin/students/${s.id}`)}
                        className="ledger-row surface-card hover:border-coral/40 border-hairline rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all group"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {s.profiles?.profile_photo_url ? (
                          <div className="w-12 h-12 relative rounded-full overflow-hidden border border-hairline flex-shrink-0">
                            <Image src={s.profiles.profile_photo_url} alt="Avatar" fill sizes="48px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-ink border border-hairline flex items-center justify-center text-mist group-hover:text-coral transition-colors">
                            <UserCircle className="w-8 h-8" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-parchment truncate group-hover:text-coral transition-colors">{s.profiles?.full_name}</h3>
                          <p className="text-[10px] font-mono text-mist tracking-widest uppercase mt-1">ID: {s.student_id}</p>
                          {!selectedClass && s.classes && (
                            <p className="text-xs text-coral truncate mt-0.5">{s.classes.class_name} {s.classes.section !== '-' ? `(${s.classes.section})` : ''}</p>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-mist group-hover:text-coral transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === 'mark_attendance' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-bold text-mist uppercase tracking-widest">Select Date:</label>
                    <DateInput
                      value={attendanceDate}
                      onChange={setAttendanceDate}
                      label=""
                      labelClass="hidden"
                    />
                  </div>
                  <button
                    onClick={handleSaveAttendance}
                    disabled={isSavingAtt || attendanceRecords.length === 0}
                    className="bg-coral text-ink px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#E67E6B] transition-colors disabled:opacity-50"
                  >
                    {isSavingAtt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Attendance
                  </button>
                </div>

                <div className="bg-ink rounded-2xl border border-hairline overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-surface border-b border-hairline">
                      <tr>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest">Student</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {attendanceRecords.map((r, i) => (
                        <tr key={r.student_id} className="ledger-row hover:bg-surface/50 transition-colors" style={{ animationDelay: `${i * 0.05}s` }}>
                          <td className="p-4">
                            <div className="font-semibold text-parchment">{r.full_name}</div>
                            <div className="text-[10px] font-mono text-mist uppercase tracking-widest mt-1">{r.student_code}</div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => updateStatus(r.student_id, 'present')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${r.status === 'present' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg' : 'bg-surface text-mist border border-hairline hover:border-emerald-500/50 hover:text-emerald-400'}`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => updateStatus(r.student_id, 'absent')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${r.status === 'absent' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg' : 'bg-surface text-mist border border-hairline hover:border-red-500/50 hover:text-red-400'}`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {attendanceRecords.length === 0 && (
                        <tr>
                          <td colSpan={2} className="p-12 text-center text-mist font-mono uppercase tracking-widest text-sm">
                            No students found to mark attendance.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MANAGE ATTENDANCE TAB */}
            {activeTab === 'manage_attendance' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <h3 className="font-display text-xl font-bold text-parchment">Manage Attendance Records</h3>
                </div>

                <div className="bg-ink rounded-2xl border border-hairline overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-surface border-b border-hairline">
                      <tr>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest">Student</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-center">Date</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-center">Status</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {manageAttendance.map((r, i) => (
                        <tr key={r.id} className="ledger-row hover:bg-surface/50 transition-colors" style={{ animationDelay: `${i * 0.05}s` }}>
                          <td className="p-4">
                            <div className="font-semibold text-parchment">{r.students?.profiles?.full_name}</div>
                            <div className="text-[10px] font-mono text-mist tracking-widest mt-1">{r.students?.student_id}</div>
                          </td>
                          <td className="p-4 text-center font-mono text-sm text-mist">{new Date(r.date).toLocaleDateString()}</td>
                          <td className="p-4 text-center">
                            <select
                              value={r.status}
                              onChange={(e) => handleUpdateManageAttendanceStatus(r.id, e.target.value)}
                              className={`bg-transparent text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer ${
                                r.status === 'present' ? 'text-emerald-400' : r.status === 'absent' ? 'text-red-400' : 'text-yellow-400'
                              }`}
                            >
                              <option className="text-ink" value="present">Present</option>
                              <option className="text-ink" value="absent">Absent</option>
                              <option className="text-ink" value="leave">Leave</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteAttendance(r.id)}
                              className="text-mist hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {manageAttendance.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-mist font-mono text-sm tracking-widest uppercase">
                            No attendance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* MANAGE RESULTS TAB */}
            {activeTab === 'manage_result' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <h3 className="font-display text-xl font-bold text-parchment">Manage Uploaded Results</h3>
                </div>

                <div className="bg-ink rounded-2xl border border-hairline overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-surface border-b border-hairline">
                      <tr>
                        <th className="p-4 w-8"></th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest">Student</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest">Exam Type</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest">Subject</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-center">Marks</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-center">Grade</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {(() => {
                        const grouped = new Map<string, GroupedResult>()
                        results.forEach(r => {
                          const key = `${r.student_id}_${r.exam_type}`
                          if (!grouped.has(key)) {
                            grouped.set(key, { ...r, subjectsList: [], totalObtained: 0, grandTotal: 0 })
                          }
                          const g = grouped.get(key)!
                          g.subjectsList.push(r)
                          g.totalObtained += r.marks_obtained
                          g.grandTotal += (r.total_marks || r.max_marks || 100)
                        })
                        const groupedArr = Array.from(grouped.values())

                        if (groupedArr.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-mist font-mono text-sm tracking-widest uppercase">
                                No results have been uploaded for this class yet.
                              </td>
                            </tr>
                          )
                        }

                        return groupedArr.map((group, i) => {
                          const key = `${group.student_id}_${group.exam_type}`
                          const p = (group.totalObtained / (group.grandTotal || 1)) * 100
                          let grade = 'F'
                          if (p >= 90) grade = 'A+'
                          else if (p >= 80) grade = 'A'
                          else if (p >= 70) grade = 'B+'
                          else if (p >= 60) grade = 'B'
                          else if (p >= 50) grade = 'C'
                          else if (p >= 40) grade = 'D'

                          const hasMultiple = group.subjectsList.length > 1
                          
                          // Component for a single row actions (only Edit now)
                          const ActionButtons = ({ r }: { r: ResultType }) => (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditResult(r)
                                }}
                                className="text-mist hover:text-veena-blue p-2 rounded-lg hover:bg-veena-blue/10 transition-colors border border-transparent hover:border-veena-blue/30"
                                title="Edit Result"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          )

                          return (
                            <React.Fragment key={group.id || key}>
                              <tr 
                                className="ledger-row hover:bg-surface/50 transition-colors group cursor-pointer" 
                                style={{ animationDelay: `${i * 0.05}s` }}
                                onClick={() => {
                                  if (!hasMultiple) return
                                  setExpandedRows(prev => {
                                    const next = new Set(prev)
                                    if (next.has(key)) next.delete(key)
                                    else next.add(key)
                                    return next
                                  })
                                }}
                              >
                                <td className="p-4 text-center">
                                  {hasMultiple && (
                                    <div className="w-6 h-6 rounded flex items-center justify-center text-mist group-hover:text-coral transition-colors" title="This exam has multiple subjects. Click to expand/collapse.">
                                      {expandedRows.has(key) ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50 -rotate-90" />}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="font-semibold text-parchment">{group.students?.profiles?.full_name}</div>
                                  <div className="text-[10px] font-mono text-mist tracking-widest mt-1">{group.students?.student_id}</div>
                                </td>
                                <td className="p-4 text-sm text-mist">{group.exam_type}</td>
                                <td className="p-4 text-sm font-semibold text-parchment">
                                  {hasMultiple ? <span className="text-coral bg-coral/10 px-2 py-0.5 rounded text-xs">{group.subjectsList.length} Subjects</span> : group.subject}
                                </td>
                                <td className="p-4 text-center font-bold text-parchment">
                                  {group.totalObtained} <span className="text-mist font-normal">/ {group.grandTotal}</span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider ${grade === 'F' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-coral/20 text-coral border-coral/30'}`}>
                                    {grade}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2 items-center">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteResult(group.subjectsList.map((s: ResultType) => s.id))
                                      }}
                                      className="flex items-center gap-1.5 text-xs font-bold text-mist hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                      title="Delete Entire Result"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPreviewSheet(group)
                                      }}
                                      className="flex items-center gap-1.5 text-xs font-bold text-mist hover:text-veena-blue p-2 rounded-lg hover:bg-veena-blue/10 transition-colors"
                                      title="Preview PDF"
                                    >
                                      <FileSpreadsheet className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPrintSheet(group)
                                      }}
                                      className="flex items-center gap-1.5 text-xs font-bold text-veena-blue hover:text-coral p-2 rounded-lg hover:bg-veena-blue/10 transition-colors"
                                      title="Download PDF"
                                    >
                                      Generate PDF
                                    </button>
                                    {!hasMultiple && <div className="ml-2 pl-2 border-l border-hairline"><ActionButtons r={group.subjectsList[0]} /></div>}
                                    {hasMultiple && (
                                      <span className="ml-2 text-[10px] text-mist/50 uppercase tracking-widest pl-2 border-l border-hairline">Multiple</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              
                              {hasMultiple && expandedRows.has(key) && group.subjectsList.map((sub: ResultType) => {
                                const sp = (sub.marks_obtained / (sub.total_marks || sub.max_marks || 1)) * 100
                                let sg = 'F'
                                if (sp >= 90) sg = 'A+'
                                else if (sp >= 80) sg = 'A'
                                else if (sp >= 70) sg = 'B+'
                                else if (sp >= 60) sg = 'B'
                                else if (sp >= 50) sg = 'C'
                                else if (sp >= 40) sg = 'D'

                                return (
                                  <tr key={sub.id} className="bg-surface/20 border-t border-hairline/50 hover:bg-surface/40 transition-colors">
                                    <td className="p-3"></td>
                                    <td className="p-3 border-l-2 border-hairline"></td>
                                    <td className="p-3 text-xs text-mist/60">{sub.exam_type}</td>
                                    <td className="p-3 text-sm font-medium text-parchment/80">{sub.subject}</td>
                                    <td className="p-3 text-center text-sm font-medium text-parchment/80">
                                      {sub.marks_obtained} <span className="text-mist/60 font-normal">/ {sub.total_marks || sub.max_marks}</span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="text-xs font-bold text-mist/80">{sg}</span>
                                    </td>
                                    <td className="p-3 pr-4">
                                      <ActionButtons r={sub} />
                                    </td>
                                  </tr>
                                )
                              })}
                            </React.Fragment>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Modals will go here */}
            
            {uploadModalOpen && selectedClassObj && (
              <ResultUploadModal
                classId={selectedClassObj.id}
                className={selectedClassObj.class_name}
                section={selectedClassObj.section || '-'}
                onClose={() => {
                  setUploadModalOpen(false)
                  // Refresh manage results to show newly uploaded results if on that tab
                  if (activeTab === 'manage_result') {
                    startTransition(async () => {
                      const { data } = await getClassResults(selectedClass)
                      if (data) setResults(data)
                    })
                  }
                }}
              />
            )}

            <AnimatePresence>
              {editResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-panel rounded-2xl border border-hairline w-full max-w-md overflow-hidden shadow-2xl"
                  >
                    <div className="p-6 border-b border-hairline flex justify-between items-center">
                      <h2 className="font-display text-xl font-bold text-parchment">Edit Marks (Admin)</h2>
                      <button onClick={() => setEditResult(null)} className="text-mist hover:text-parchment transition-colors"><X className="w-5 h-5"/></button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="surface-card p-4 rounded-xl border border-hairline">
                        <p className="text-sm font-medium text-parchment mb-1">{editResult.students?.profiles?.full_name}</p>
                        <p className="text-xs text-coral font-mono mb-2">{editResult.subject} — {editResult.exam_type}</p>
                      </div>

                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        const fd = new FormData(e.currentTarget)
                        const mObtained = parseFloat(fd.get('marksObtained') as string)
                        const tMarks = parseFloat(fd.get('totalMarks') as string)
                        if (mObtained > tMarks) { alert('Marks obtained cannot be > total marks'); return }
                        
                        startTransition(async () => {
                          const res = await uploadStudentResult(editResult.class_id, editResult.student_id, {
                            exam_type: editResult.exam_type,
                            subject: editResult.subject,
                            marks_obtained: mObtained,
                            total_marks: tMarks
                          })
                          if (res.error) alert(res.error)
                          else {
                            setEditResult(null)
                            const { data } = await getClassResults(selectedClass)
                            if (data) setResults(data)
                          }
                        })
                      }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-1.5">Marks Obtained</label>
                            <input
                              type="number" name="marksObtained" defaultValue={editResult.marks_obtained}
                              required step="0.01" min="0"
                              className="w-full input-glass rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral/60 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-1.5">Total Marks</label>
                            <input
                              type="number" name="totalMarks" defaultValue={editResult.total_marks || editResult.max_marks}
                              required step="0.01" min="1"
                              className="w-full input-glass rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral/60 transition-all"
                            />
                          </div>
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isPending}
                          className="w-full bg-coral hover:bg-[#E67E6B] text-ink font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                          Save Changes
                        </button>
                      </form>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            
            {/* PDF PREVIEW MODAL */}
            {previewSheet && (
              <MarksheetModal
                sheet={mapGroupToMarksheet(previewSheet)}
                onClose={() => setPreviewSheet(null)}
                readOnly
              />
            )}

            {/* PRINT PORTAL */}
            {printSheet && (
              <PrintPortal>
                <MarksheetTemplate sheet={mapGroupToMarksheet(printSheet)} printId="marksheet-print-portal" />
              </PrintPortal>
            )}
          </div>
      </div>
    </div>
  )
}
