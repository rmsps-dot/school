'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Users,
  UserCircle,
  Loader2,
  GraduationCap,
  ArrowLeft,
  Plus,
  Edit3,
  CheckCircle,
  AlertCircle,
  Clock,
  Check,
  X,
  Sparkles,
} from 'lucide-react'
import { getStudentsByClass } from '@/actions/class-actions'
import type { StudentViewRecord } from '@/actions/class-actions'
import type { ClassWithSubject } from '@/actions/result-actions'
import { teacherUpdateStudent } from '@/actions/teacher-actions'
import {
  approveProfileChangeRequest,
  rejectProfileChangeRequest,
  type ProfileChangeRequestItem,
} from '@/actions/profile-request-actions'
import DateInput from '@/components/shared/DateInput'

interface Props {
  classes: ClassWithSubject[]
  initialPendingRequests: ProfileChangeRequestItem[]
}

export default function TeacherStudentsClient({ classes, initialPendingRequests }: Props) {
  const [activeTab, setActiveTab] = useState<'students' | 'requests'>('students')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [students, setStudents] = useState<StudentViewRecord[]>([])
  const [requests, setRequests] = useState<ProfileChangeRequestItem[]>(initialPendingRequests)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  // Action status message
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 3D ID Card State
  const [viewStudent, setViewStudent] = useState<StudentViewRecord | null>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<StudentViewRecord | null>(null)
  const [editDob, setEditDob] = useState('')
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  useEffect(() => {
    startTransition(async () => {
      const res = await getStudentsByClass(selectedClass || undefined)
      if (res.data) setStudents(res.data)
    })
  }, [selectedClass])

  const filteredStudents = students.filter(
    (s) =>
      s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase())
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const box = card.getBoundingClientRect()
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    const centerX = box.width / 2
    const centerY = box.height / 2

    const rotateXValue = ((y - centerY) / centerY) * -10
    const rotateYValue = ((x - centerX) / centerX) * 10

    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleOpenEdit = (student: StudentViewRecord) => {
    setEditingStudent(student)
    setEditDob(student.profiles?.dob || '')
    setEditError('')
    setEditSuccess('')
    setViewStudent(null)
  }

  const handleCloseEdit = () => {
    setEditingStudent(null)
    setEditError('')
    setEditSuccess('')
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')

    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await teacherUpdateStudent(fd)
      if (res.error) {
        setEditError(res.error)
      } else {
        const updatedFullName = (fd.get('fullName') as string)?.trim()
        const updatedStudentId = (fd.get('studentId') as string)?.trim()
        const updatedFatherName = (fd.get('fatherName') as string)?.trim() || null
        const updatedMotherName = (fd.get('motherName') as string)?.trim() || null
        const updatedPhone = (fd.get('phone') as string)?.trim() || null
        const updatedAddress = (fd.get('address') as string)?.trim() || null

        // Update in-memory state accurately
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === editingStudent?.id) {
              return {
                ...s,
                student_id: updatedStudentId || s.student_id,
                father_name: updatedFatherName,
                mother_name: updatedMotherName,
                profiles: s.profiles
                  ? {
                      ...s.profiles,
                      full_name: updatedFullName || s.profiles.full_name,
                      mobile: updatedPhone,
                      address: updatedAddress,
                      dob: editDob || null,
                    }
                  : null,
              }
            }
            return s
          })
        )

        setEditSuccess('Student details updated successfully!')
        setTimeout(() => {
          handleCloseEdit()
        }, 1200)
      }
    })
  }

  // Teacher handles student/parent profile change request approval
  const handleApproveRequest = async (requestId: string) => {
    startTransition(async () => {
      const res = await approveProfileChangeRequest(requestId)
      if (res.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId))
        setActionMessage({ type: 'success', text: 'Profile change request approved and applied successfully!' })
        // Refresh students list
        const refreshed = await getStudentsByClass(selectedClass || undefined)
        if (refreshed.data) setStudents(refreshed.data)
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to approve request.' })
      }
      setTimeout(() => setActionMessage(null), 4000)
    })
  }

  // Teacher handles request rejection
  const handleRejectRequest = async (requestId: string) => {
    startTransition(async () => {
      const res = await rejectProfileChangeRequest(requestId, 'Rejected by Class Teacher.')
      if (res.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId))
        setActionMessage({ type: 'success', text: 'Profile change request has been rejected.' })
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to reject request.' })
      }
      setTimeout(() => setActionMessage(null), 4000)
    })
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-hairline gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-2 font-display text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-coral text-coral'
              : 'border-transparent text-mist hover:text-parchment'
          }`}
        >
          <Users className="w-4 h-4" />
          Enrolled Students ({students.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-2 font-display text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-coral text-coral'
              : 'border-transparent text-mist hover:text-parchment'
          }`}
        >
          <Clock className="w-4 h-4" />
          Profile Change Requests
          {requests.length > 0 && (
            <span className="bg-coral text-ink text-[10px] px-2 py-0.5 rounded-full font-bold">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Global Action Message */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-mono border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <p>{actionMessage.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: ENROLLED STUDENTS DIRECTORY
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="surface-card p-4 rounded-2xl border border-hairline flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-64">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-ink/50 border border-hairline rounded-xl px-4 py-2.5 text-parchment focus:outline-none focus:border-coral/60 transition-colors"
              >
                <option value="">All Assigned Classes</option>
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    Class {c.className} - {c.section}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-ink/50 border border-hairline rounded-xl pl-9 pr-4 py-2 text-sm text-parchment placeholder:text-mist/50 focus:outline-none focus:border-coral/60 transition-colors"
              />
            </div>
          </div>

          {/* Student Grid */}
          <div>
            {isPending ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-coral animate-spin" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-mist">
                <UserCircle className="w-16 h-16 mb-4 opacity-50" />
                <p>No students found for this class.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStudents.map((s) => (
                  <div
                    key={s.id}
                    className="surface-card hover:border-coral/40 border border-hairline rounded-2xl p-4 flex flex-col justify-between transition-all group"
                  >
                    <div
                      onClick={() => setViewStudent(s)}
                      className="flex items-center gap-3.5 cursor-pointer"
                    >
                      {s.profiles?.profile_photo_url ? (
                        <div className="w-12 h-12 relative rounded-full overflow-hidden border border-hairline flex-shrink-0">
                          <Image
                            src={s.profiles.profile_photo_url}
                            alt="Avatar"
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-coral/10 border border-hairline flex items-center justify-center text-coral shrink-0 group-hover:bg-coral/20 transition-colors">
                          <UserCircle className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-parchment truncate group-hover:text-coral transition-colors text-sm">
                          {s.profiles?.full_name}
                        </h3>
                        <p className="text-xs text-mist font-mono mt-0.5">
                          ID: <span className="text-coral font-bold">{s.student_id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-hairline">
                      <button
                        type="button"
                        onClick={() => setViewStudent(s)}
                        className="w-full py-2 rounded-xl bg-ink/60 border border-hairline text-center text-xs font-bold text-mist hover:text-parchment hover:border-coral/50 transition-colors block"
                      >
                        View ID Card & Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PROFILE CHANGE REQUESTS (CLASS TEACHER QUEUE)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="surface-card rounded-3xl p-12 text-center border border-hairline space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-parchment">All Caught Up!</h3>
              <p className="text-mist text-xs max-w-sm mx-auto">
                There are no pending profile update requests from students or parents in your assigned classes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => {
                const reqData = req.requested_data || {}
                const curData = req.current_data || {}

                return (
                  <div
                    key={req.id}
                    className="surface-card rounded-3xl p-6 border border-hairline space-y-5 hover:border-coral/40 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center font-bold">
                          {req.profiles?.profile_photo_url ? (
                            <Image
                              src={req.profiles.profile_photo_url}
                              alt="Avatar"
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            req.profiles?.full_name?.charAt(0) || <UserCircle className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-parchment text-lg">
                              {req.profiles?.full_name || 'Student / Parent'}
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-coral/15 text-coral border border-coral/30">
                              {req.role}
                            </span>
                          </div>
                          <p className="text-mist text-xs font-mono mt-0.5">
                            Class: {req.classes ? `${req.classes.class_name} - ${req.classes.section}` : 'General'}{' '}
                            · Requested {formatDate(req.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-4 py-2 rounded-xl bg-ink/70 border border-hairline text-mist hover:text-red-400 hover:border-red-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleApproveRequest(req.id)}
                          className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-ink text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg"
                        >
                          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Approve & Apply
                        </button>
                      </div>
                    </div>

                    {/* Diff Comparison Table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      {/* Current details */}
                      <div className="bg-ink/40 rounded-2xl p-4 border border-hairline space-y-2">
                        <p className="text-mist font-bold uppercase tracking-wider text-[10px]">
                          Current Details
                        </p>
                        <div className="space-y-1 text-parchment/80">
                          <p>
                            <span className="text-mist">Name:</span> {curData.fullName || '—'}
                          </p>
                          {curData.fatherName !== undefined && (
                            <p>
                              <span className="text-mist">Father:</span> {curData.fatherName || '—'}
                            </p>
                          )}
                          {curData.motherName !== undefined && (
                            <p>
                              <span className="text-mist">Mother:</span> {curData.motherName || '—'}
                            </p>
                          )}
                          <p>
                            <span className="text-mist">Mobile:</span> {curData.mobile || '—'}
                          </p>
                          <p>
                            <span className="text-mist">DOB:</span> {formatDate(curData.dob as string)}
                          </p>
                          <p>
                            <span className="text-mist">Address:</span> {curData.address || '—'}
                          </p>
                        </div>
                      </div>

                      {/* Requested changes */}
                      <div className="bg-coral/5 rounded-2xl p-4 border border-coral/20 space-y-2">
                        <p className="text-coral font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" /> Requested Updates
                        </p>
                        <div className="space-y-1 text-parchment">
                          <p className={curData.fullName !== reqData.fullName ? 'text-coral font-bold' : ''}>
                            <span className="text-mist">Name:</span> {reqData.fullName || '—'}
                          </p>
                          {reqData.fatherName !== undefined && (
                            <p className={curData.fatherName !== reqData.fatherName ? 'text-coral font-bold' : ''}>
                              <span className="text-mist">Father:</span> {reqData.fatherName || '—'}
                            </p>
                          )}
                          {reqData.motherName !== undefined && (
                            <p className={curData.motherName !== reqData.motherName ? 'text-coral font-bold' : ''}>
                              <span className="text-mist">Mother:</span> {reqData.motherName || '—'}
                            </p>
                          )}
                          <p className={curData.mobile !== reqData.mobile ? 'text-coral font-bold' : ''}>
                            <span className="text-mist">Mobile:</span> {reqData.mobile || '—'}
                          </p>
                          <p className={curData.dob !== reqData.dob ? 'text-coral font-bold' : ''}>
                            <span className="text-mist">DOB:</span> {formatDate(reqData.dob as string)}
                          </p>
                          <p className={curData.address !== reqData.address ? 'text-coral font-bold' : ''}>
                            <span className="text-mist">Address:</span> {reqData.address || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 3D ID Card Modal */}
      <AnimatePresence>
        {viewStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md"
            onClick={() => setViewStudent(null)}
          >
            <div
              className="relative max-w-sm w-full perspective-1000"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                animate={{ rotateX, rotateY }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
                className="surface-card preserve-3d border border-hairline rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
              >
                {/* School Branding Header */}
                <div className="w-full flex items-center justify-between border-b border-hairline pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-hairline flex items-center justify-center">
                      <Image src="/icon-192.png" alt="RMSPS Logo" width={32} height={32} className="object-cover" />
                    </div>
                    <span className="font-display font-bold text-xs tracking-wider text-parchment">
                      RMSPS DIGITAL ID
                    </span>
                  </div>
                  <div className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-coral/20 text-coral font-bold">
                    Student
                  </div>
                </div>

                {/* Profile Photo */}
                <div className="w-24 h-24 relative rounded-full overflow-hidden border-2 border-coral shadow-lg mb-4">
                  {viewStudent.profiles?.profile_photo_url ? (
                    <Image
                      src={viewStudent.profiles.profile_photo_url}
                      alt="Avatar"
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-coral/20 flex items-center justify-center text-coral">
                      <UserCircle className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Student Identity */}
                <h2 className="font-display text-xl font-bold text-parchment">
                  {viewStudent.profiles?.full_name}
                </h2>
                <p className="text-xs text-coral font-mono font-bold mt-1">
                  Roll: {viewStudent.student_id}
                </p>

                {/* Info List */}
                <div className="w-full space-y-2 mt-6 text-left text-xs">
                  <div className="flex justify-between border-b border-hairline pb-1">
                    <span className="text-mist">Class:</span>
                    <span className="text-parchment font-semibold">
                      {viewStudent.classes ? `${viewStudent.classes.class_name} - ${viewStudent.classes.section}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-hairline pb-1">
                    <span className="text-mist">D.O.B:</span>
                    <span className="text-parchment font-semibold">
                      {formatDate(viewStudent.profiles?.dob)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-hairline pb-1">
                    <span className="text-mist">Father:</span>
                    <span className="text-parchment font-semibold">
                      {viewStudent.father_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-hairline pb-1">
                    <span className="text-mist">Mother:</span>
                    <span className="text-parchment font-semibold">
                      {viewStudent.mother_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-hairline pb-1">
                    <span className="text-mist">Phone:</span>
                    <span className="text-parchment font-semibold">
                      {viewStudent.profiles?.mobile || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-hairline pb-1">
                    <span className="text-mist">Address:</span>
                    <span className="text-parchment font-semibold truncate max-w-[150px]">
                      {viewStudent.profiles?.address || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Barcode & Actions */}
                <div className="w-full mt-6 space-y-3">
                  <div className="w-full h-8 flex items-center justify-between opacity-30 px-4">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className={`bg-parchment ${
                          i % 3 === 0 ? 'h-full w-[2px]' : i % 2 === 0 ? 'h-3/4 w-[1px]' : 'h-full w-[1px]'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(viewStudent)}
                      className="flex-1 bg-coral/20 hover:bg-coral/30 border border-coral/40 text-coral py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewStudent(null)}
                      className="flex-1 bg-ink border border-hairline hover:border-mist text-mist hover:text-parchment py-2.5 rounded-xl font-bold text-xs transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {editingStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-md"
            onClick={handleCloseEdit}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="surface-card border border-hairline rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-parchment">Edit Student Details</h2>
                  <p className="text-xs text-mist mt-0.5">Direct faculty update</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="w-8 h-8 rounded-full bg-ink/60 border border-hairline flex items-center justify-center text-mist hover:text-parchment transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs mb-6">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{editError}</p>
                </div>
              )}

              {editSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-xs mb-6">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{editSuccess}</p>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <input type="hidden" name="studentIdDb" value={editingStudent.id} />
                <input type="hidden" name="profileId" value={editingStudent.profiles?.id || ''} />

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-coral uppercase tracking-widest border-b border-hairline pb-2">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        required
                        type="text"
                        name="fullName"
                        defaultValue={editingStudent.profiles?.full_name || ''}
                        className="w-full bg-ink border border-hairline rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">
                        Roll / Student ID
                      </label>
                      <input
                        required
                        type="text"
                        name="studentId"
                        defaultValue={editingStudent.student_id || ''}
                        className="w-full bg-ink border border-hairline rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral transition-colors"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <DateInput label="Date of Birth" value={editDob} onChange={setEditDob} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-coral uppercase tracking-widest border-b border-hairline pb-2">
                    Family & Contact Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">
                        Father&apos;s Name
                      </label>
                      <input
                        type="text"
                        name="fatherName"
                        defaultValue={editingStudent.father_name || ''}
                        className="w-full bg-ink border border-hairline rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">
                        Mother&apos;s Name
                      </label>
                      <input
                        type="text"
                        name="motherName"
                        defaultValue={editingStudent.mother_name || ''}
                        className="w-full bg-ink border border-hairline rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={editingStudent.profiles?.mobile || ''}
                        className="w-full bg-ink border border-hairline rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Address</label>
                      <input
                        type="text"
                        name="address"
                        defaultValue={editingStudent.profiles?.address || ''}
                        className="w-full bg-ink border border-hairline rounded-xl px-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="flex-1 px-5 py-3 rounded-xl font-semibold text-xs bg-ink border border-hairline text-parchment hover:border-mist transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-coral text-ink py-3 px-5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#E67E6B] transition-colors"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `,
        }}
      />
    </div>
  )
}
