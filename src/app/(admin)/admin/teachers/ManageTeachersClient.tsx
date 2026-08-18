'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  UserCircle,
  Trash2,
  Loader2,
  UserX,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Edit3,
  Check,
  X,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import {
  addTeacher,
  deleteTeacher,
  updateTeacherProfile,
  getAllTeachers,
} from '@/actions/user-management-actions'
import { updateTeacherClassAssignments } from '@/actions/admin-management-actions'
import DateInput from '@/components/shared/DateInput'

export type TeacherRecord = Exclude<Awaited<ReturnType<typeof getAllTeachers>>['data'], null>[number]

interface ClassItem {
  id: string
  class_name: string
  section: string
}

interface ManageTeachersClientProps {
  teachers: TeacherRecord[]
  classes: ClassItem[]
}

export default function ManageTeachersClient({
  teachers: initialTeachers,
  classes,
}: ManageTeachersClientProps) {
  const [teachers, setTeachers] = useState(initialTeachers)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Add Teacher Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addJoiningDate, setAddJoiningDate] = useState('')
  const [addTeacherDob, setAddTeacherDob] = useState('')

  // Edit Teacher Modal
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editQualification, setEditQualification] = useState('')
  const [editMobile, setEditMobile] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editDob, setEditDob] = useState('')
  const [editJoiningDate, setEditJoiningDate] = useState('')

  // Assign Classes Modal
  const [assigningTeacher, setAssigningTeacher] = useState<TeacherRecord | null>(null)
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])

  const filteredTeachers = teachers.filter(
    (t) =>
      t.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.teacher_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.qualification?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await addTeacher(fd)
      if (res.error) setError(res.error)
      else window.location.reload()
    })
  }

  const handleOpenEdit = (t: TeacherRecord) => {
    setEditingTeacher(t)
    setEditFullName(t.profiles?.full_name || '')
    setEditQualification(t.qualification || '')
    setEditMobile(t.profiles?.mobile || '')
    setEditAddress(t.profiles?.address || '')
    setEditDob(t.profiles?.dob ? t.profiles.dob.split('T')[0] : '')
    setEditJoiningDate(t.joining_date ? t.joining_date.split('T')[0] : '')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTeacher) return
    setError('')

    startTransition(async () => {
      const res = await updateTeacherProfile(editingTeacher.profile_id, {
        full_name: editFullName,
        qualification: editQualification,
        mobile: editMobile,
        address: editAddress,
        dob: editDob || null,
        joining_date: editJoiningDate || null,
      })

      if (res.error) {
        setError(res.error)
      } else {
        setTeachers((prev) =>
          prev.map((t) =>
            t.profile_id === editingTeacher.profile_id
              ? {
                  ...t,
                  qualification: editQualification,
                  joining_date: editJoiningDate,
                  profiles: {
                    ...t.profiles,
                    full_name: editFullName,
                    mobile: editMobile,
                    address: editAddress,
                    dob: editDob,
                  },
                }
              : t
          )
        )
        setEditingTeacher(null)
        setSuccessMsg('Teacher profile updated successfully.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  const handleOpenAssign = (t: TeacherRecord) => {
    setAssigningTeacher(t)
    // Extract assigned class ids
    const currentClassIds = (t.teacher_classes || [])
      .map((tc) => {
        const c = Array.isArray(tc.classes) ? tc.classes[0] : tc.classes
        return tc.class_id || c?.id
      })
      .filter((id): id is string => Boolean(id))
    setSelectedClassIds(currentClassIds)
  }

  const toggleClassSelect = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    )
  }

  const handleSaveAssign = async () => {
    if (!assigningTeacher) return
    setError('')

    startTransition(async () => {
      const res = await updateTeacherClassAssignments(assigningTeacher.id, selectedClassIds)
      if (res.error) {
        setError(res.error)
      } else {
        // Re-construct teacher classes for local state
        const updatedClasses = selectedClassIds.map((cid) => {
          const cls = classes.find((c) => c.id === cid)
          return {
            class_id: cid,
            subject: 'General',
            classes: cls ? { id: cls.id, class_name: cls.class_name, section: cls.section } : null,
          }
        })

        setTeachers((prev) =>
          prev.map((t) =>
            t.id === assigningTeacher.id ? { ...t, teacher_classes: updatedClasses as any } : t
          )
        )
        setAssigningTeacher(null)
        setSuccessMsg('Teacher class assignments updated successfully.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this teacher and all their assignments?')) return

    startTransition(async () => {
      const res = await deleteTeacher(profileId)
      if (res.error) setError(res.error)
      else setTeachers((prev) => prev.filter((t) => t.profile_id !== profileId))
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="surface-card rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-coral" />
            Manage Teachers
          </h1>
          <p className="text-mist mt-2 max-w-md">
            Directly add, edit teacher profiles, assign classes, or manage records from this directory.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 input-glass rounded-xl text-sm text-parchment focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/50 w-full transition-all"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto bg-coral text-ink py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap hover:bg-[#E67E6B] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl flex items-center gap-3 text-sm font-mono"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-xl flex items-center gap-3 text-sm font-mono"
          >
            <Check className="w-5 h-5 flex-shrink-0" />
            <p>{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((t, index) => (
          <div
            key={t.id}
            className="ledger-row surface-card border-hairline overflow-hidden relative group transition-transform hover:-translate-y-1 hover:border-coral/40 flex flex-col justify-between"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Top Action Toolbar */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => handleOpenEdit(t)}
                className="p-2 text-mist hover:text-parchment hover:bg-white/10 rounded-lg transition-colors backdrop-blur-md bg-ink/70 border border-hairline"
                title="Edit Teacher Profile"
              >
                <Edit3 className="w-4 h-4 text-coral" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenAssign(t)}
                className="p-2 text-mist hover:text-parchment hover:bg-white/10 rounded-lg transition-colors backdrop-blur-md bg-ink/70 border border-hairline"
                title="Assign Classes"
              >
                <BookOpen className="w-4 h-4 text-veena-blue" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(t.profile_id)}
                className="p-2 text-mist hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors backdrop-blur-md bg-ink/70 border border-hairline"
                title="Delete Teacher"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-8 flex flex-col items-center text-center border-b border-hairline bg-surface">
              <Link href={`/admin/teachers/${t.profile_id}`} className="flex flex-col items-center group/link">
                {t.profiles?.avatar_url ? (
                  <Image
                    src={t.profiles.avatar_url}
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover border-4 border-ink shadow-xl mb-4 group-hover/link:ring-2 ring-coral transition-all"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-ink border-4 border-ink flex items-center justify-center shadow-xl mb-4 text-mist group-hover/link:ring-2 ring-coral group-hover/link:text-coral transition-all">
                    <UserCircle className="w-10 h-10" />
                  </div>
                )}
                <h3 className="font-display font-bold text-xl text-parchment group-hover/link:text-coral transition-colors">
                  {t.profiles?.full_name}
                </h3>
              </Link>
              <p className="text-sm text-coral font-medium mt-1 font-mono">{t.teacher_id}</p>
              <p className="text-xs text-mist mt-2 line-clamp-1 border border-hairline px-3 py-1 rounded-full">
                {t.qualification || 'Qualification Not Specified'}
              </p>
            </div>

            {/* Assigned Classes Preview */}
            <div className="p-5 bg-ink flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-mist" />
                    <h4 className="text-[11px] font-bold text-parchment uppercase tracking-widest">
                      Assigned Classes
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAssign(t)}
                    className="text-[11px] font-mono text-coral hover:underline"
                  >
                    + Manage
                  </button>
                </div>
                {t.teacher_classes && t.teacher_classes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {t.teacher_classes.map((tc, i: number) => {
                      const cls = Array.isArray(tc.classes) ? tc.classes[0] : tc.classes
                      return (
                        <span
                          key={i}
                          className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-surface border border-hairline rounded-md text-mist"
                        >
                          {cls?.class_name} {cls?.section ? `(${cls.section})` : ''}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-mist/60 italic font-mono">No classes assigned yet.</p>
                )}
              </div>

              {/* Bottom Profile Link */}
              <Link
                href={`/admin/teachers/${t.profile_id}`}
                className="w-full py-2.5 rounded-xl bg-surface border border-hairline text-center text-xs font-bold text-mist hover:text-parchment hover:border-coral/50 transition-colors"
              >
                View Full Profile & Log →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="surface-card rounded-[2rem] p-16 text-center border border-hairline">
          <UserX className="w-16 h-16 text-mist mx-auto mb-6 opacity-50" />
          <h2 className="font-display text-2xl font-bold text-parchment">No Teachers Found</h2>
          <p className="text-mist mt-2 max-w-sm mx-auto">
            Try adjusting your search criteria or add a new teacher to the directory.
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. ADD TEACHER MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center sticky top-0 bg-ink/90 backdrop-blur-md z-10">
                <h2 className="font-display text-2xl font-bold text-parchment">Add New Teacher</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-mist hover:text-coral transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddTeacher} className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-mist uppercase tracking-widest font-mono">
                    Account Credentials
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-parchment block mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-parchment block mb-1">Password</label>
                      <input
                        type="password"
                        name="password"
                        required
                        className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-mist uppercase tracking-widest font-mono">
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-parchment block mb-1">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-parchment block mb-1">Qualification</label>
                      <input
                        type="text"
                        name="qualification"
                        required
                        placeholder="e.g. B.Ed, M.Sc Physics"
                        className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-parchment block mb-1">Mobile</label>
                      <input
                        type="tel"
                        name="mobile"
                        className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-parchment block mb-1">Date of Birth</label>
                      <DateInput name="dob" value={addTeacherDob} onChange={setAddTeacherDob} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-parchment block mb-1">Address</label>
                      <input
                        type="text"
                        name="address"
                        className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-parchment block mb-1">Joining Date</label>
                      <DateInput name="joiningDate" value={addJoiningDate} onChange={setAddJoiningDate} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-3 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-coral text-ink px-8 py-3 rounded-xl font-semibold text-sm hover:bg-[#E67E6B] transition-colors flex items-center gap-2"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Teacher
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. DIRECT EDIT TEACHER MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar bg-ink text-parchment"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center sticky top-0 bg-ink/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-parchment">Edit Teacher Profile</h2>
                    <p className="text-xs text-mist font-mono">{editingTeacher.teacher_id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Qualification
                    </label>
                    <input
                      type="text"
                      required
                      value={editQualification}
                      onChange={(e) => setEditQualification(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Date of Birth
                    </label>
                    <DateInput name="editDob" value={editDob} onChange={setEditDob} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Joining Date
                    </label>
                    <DateInput name="editJoiningDate" value={editJoiningDate} onChange={setEditJoiningDate} />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="px-6 py-3 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-coral text-ink px-8 py-3 rounded-xl font-semibold text-sm hover:bg-[#E67E6B] transition-colors flex items-center gap-2"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          3. ASSIGN CLASSES MODAL (SHIFTED DIRECTLY HERE)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {assigningTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-xl max-h-[90vh] overflow-y-auto hide-scrollbar bg-ink text-parchment"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center sticky top-0 bg-ink/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-veena-blue/20 text-veena-blue flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-parchment">Assign Classes</h2>
                    <p className="text-xs text-mist">{assigningTeacher.profiles?.full_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningTeacher(null)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-xs text-mist">
                  Select the classes this teacher is responsible for. They will be able to mark student attendance and upload marks for assigned classes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {classes.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id)
                    return (
                      <div
                        key={cls.id}
                        onClick={() => toggleClassSelect(cls.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-coral/15 border-coral text-parchment'
                            : 'bg-surface border-hairline text-mist hover:border-mist'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-parchment">{cls.class_name}</p>
                          <p className="text-[11px] font-mono text-mist">
                            {cls.section ? `Section ${cls.section}` : 'Standard'}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-coral border-coral text-ink font-bold'
                              : 'border-hairline bg-ink'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setAssigningTeacher(null)}
                    className="px-6 py-3 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssign}
                    disabled={isPending}
                    className="bg-veena-blue text-ink px-8 py-3 rounded-xl font-semibold text-sm hover:bg-veena-blue/90 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Class Assignments
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
