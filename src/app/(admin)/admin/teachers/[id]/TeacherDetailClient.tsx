'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Phone,
  Calendar,
  MapPin,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Clock,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'
import {
  editTeacherAttendanceStatus,
  deleteTeacherAttendance,
  recordTeacherPayment,
  editTeacherPayment,
  deleteTeacherPayment,
  updateTeacherClassAssignments,
} from '@/actions/admin-management-actions'
import { updateTeacherProfile, type getTeacherDetails } from '@/actions/user-management-actions'
import DateInput from '@/components/shared/DateInput'
import AvatarUpload from '@/components/ui/AvatarUpload'
import type { Database } from '@/types/supabase'

export type TeacherDetailData = Exclude<Awaited<ReturnType<typeof getTeacherDetails>>['data'], null>

interface ClassItem {
  id: string
  class_name: string
  section: string
}

type TabType = 'overview' | 'attendance' | 'payments'

interface Props {
  teacher: TeacherDetailData
  classes: ClassItem[]
}

export default function TeacherDetailClient({ teacher, classes: allAvailableClasses }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Profile data
  const [profile, setProfile] = useState(teacher.profiles || {})
  const [qualification, setQualification] = useState(teacher.qualification || '')
  const [joiningDate, setJoiningDate] = useState(teacher.joining_date || '')
  const [teacherClasses, setTeacherClasses] = useState(teacher.teacher_classes || [])
  const [attendance, setAttendance] = useState(teacher.teacher_attendance || [])
  const [payments, setPayments] = useState(teacher.teacher_payments || [])

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editFullName, setEditFullName] = useState(profile.full_name || '')
  const [editQual, setEditQual] = useState(qualification)
  const [editMobile, setEditMobile] = useState(profile.mobile || '')
  const [editAddress, setEditAddress] = useState(profile.address || '')
  const [editDob, setEditDob] = useState(profile.dob ? profile.dob.split('T')[0] : '')
  const [editJoining, setEditJoining] = useState(joiningDate ? joiningDate.split('T')[0] : '')

  // Manage Assigned Classes Modal
  const [isAssignClassesOpen, setIsAssignClassesOpen] = useState(false)
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(() =>
    teacherClasses
      .map((tc) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = tc as any
        return raw.class_id || raw.classes?.[0]?.id || raw.classes?.id
      })
      .filter(Boolean)
  )

  // Payment Modal (Add / Edit)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid')
  const [paymentRemarks, setPaymentRemarks] = useState('')

  // Edit Attendance Status Modal
  const [editingAttendance, setEditingAttendance] = useState<typeof attendance[0] | null>(null)
  const [attendanceNewStatus, setAttendanceNewStatus] = useState<Database['public']['Enums']['attendance_status']>('present')

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const presentDays = attendance.filter((a) => a.status === 'present').length
  const absentDays = attendance.filter((a) => a.status === 'absent').length

  const formatDate = (d?: string | null) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ── Profile Edit Handler ──
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    startTransition(async () => {
      const res = await updateTeacherProfile(teacher.profile_id, {
        full_name: editFullName,
        qualification: editQual,
        mobile: editMobile,
        address: editAddress,
        dob: editDob || null,
        joining_date: editJoining || null,
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setProfile((prev) => ({
          ...prev,
          full_name: editFullName,
          mobile: editMobile,
          address: editAddress,
          dob: editDob,
        }))
        setQualification(editQual)
        setJoiningDate(editJoining)
        setIsEditProfileOpen(false)
        setSuccessMsg('Profile updated successfully.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  // ── Class Assignment Save ──
  const handleSaveClassAssignments = async () => {
    setErrorMsg('')
    startTransition(async () => {
      const res = await updateTeacherClassAssignments(teacher.id, selectedClassIds)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        const updated = selectedClassIds.map((cid) => {
          const cls = allAvailableClasses.find((c) => c.id === cid)
          return {
            class_id: cid,
            subject: 'General',
            classes: cls ? { id: cls.id, class_name: cls.class_name, section: cls.section } : null,
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTeacherClasses(updated as any)
        setIsAssignClassesOpen(false)
        setSuccessMsg('Assigned classes updated successfully.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  // ── Payment Handlers ──
  const handleOpenAddPayment = () => {
    setEditingPaymentId(null)
    setPaymentAmount('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentStatus('paid')
    setPaymentRemarks('')
    setIsPaymentModalOpen(true)
  }

  const handleOpenEditPayment = (p: typeof payments[0]) => {
    setEditingPaymentId(p.id)
    setPaymentAmount(p.amount)
    setPaymentDate(p.payment_date ? p.payment_date.split('T')[0] : new Date().toISOString().split('T')[0])
    setPaymentStatus((p.status as 'paid' | 'pending') || 'paid')
    setPaymentRemarks(p.remarks || '')
    setIsPaymentModalOpen(true)
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentAmount === '' || Number(paymentAmount) <= 0) return
    setErrorMsg('')

    startTransition(async () => {
      if (editingPaymentId) {
        // Edit existing payment
        const res = await editTeacherPayment(editingPaymentId, {
          amount: Number(paymentAmount),
          payment_date: paymentDate,
          status: paymentStatus,
          remarks: paymentRemarks,
        })
        if (res.error) {
          setErrorMsg(res.error)
        } else {
          setPayments((prev) =>
            prev.map((p) =>
              p.id === editingPaymentId
                ? {
                    ...p,
                    amount: Number(paymentAmount),
                    payment_date: paymentDate,
                    status: paymentStatus,
                    remarks: paymentRemarks,
                  }
                : p
            )
          )
          setIsPaymentModalOpen(false)
          setSuccessMsg('Payment record updated.')
          setTimeout(() => setSuccessMsg(''), 3000)
        }
      } else {
        // Add new payment
        const res = await recordTeacherPayment(teacher.id, {
          amount: Number(paymentAmount),
          payment_date: paymentDate,
          status: paymentStatus,
          remarks: paymentRemarks,
        })
        if (res.error) {
          setErrorMsg(res.error)
        } else {
          setPayments([
            {
              id: `pay-${Date.now()}`,
              amount: Number(paymentAmount),
              payment_date: paymentDate,
              status: paymentStatus,
              remarks: paymentRemarks,
            },
            ...payments,
          ])
          setIsPaymentModalOpen(false)
          setSuccessMsg('Payment recorded successfully.')
          setTimeout(() => setSuccessMsg(''), 3000)
        }
      }
    })
  }

  const handleDeletePayment = (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return

    startTransition(async () => {
      const res = await deleteTeacherPayment(id)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setPayments((prev) => prev.filter((p) => p.id !== id))
        setSuccessMsg('Payment record deleted.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  // ── Attendance Handlers ──
  const handleOpenEditAttendance = (att: typeof attendance[0]) => {
    setEditingAttendance(att)
    setAttendanceNewStatus(att.status as Database['public']['Enums']['attendance_status'])
  }

  const handleSaveAttendanceStatus = async () => {
    if (!editingAttendance) return
    setErrorMsg('')

    startTransition(async () => {
      const res = await editTeacherAttendanceStatus(editingAttendance.id, attendanceNewStatus)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setAttendance((prev) =>
          prev.map((a) => (a.id === editingAttendance.id ? { ...a, status: attendanceNewStatus } : a))
        )
        setEditingAttendance(null)
        setSuccessMsg('Attendance status updated.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  const handleDeleteAttendance = (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher attendance record?')) return

    startTransition(async () => {
      const res = await deleteTeacherAttendance(id)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setAttendance((prev) => prev.filter((a) => a.id !== id))
        setSuccessMsg('Attendance entry deleted.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'attendance', label: 'Attendance Log', icon: Clock },
    { id: 'payments', label: 'Payments', icon: IndianRupee },
  ]

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/teachers"
            className="p-2.5 rounded-xl surface-card border border-hairline hover:border-mist/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-parchment" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-parchment leading-tight">Teacher Profile</h1>
            <p className="text-coral text-sm font-mono tracking-wider">{teacher.teacher_id}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditFullName(profile.full_name || '')
            setEditQual(qualification)
            setEditMobile(profile.mobile || '')
            setEditAddress(profile.address || '')
            setEditDob(profile.dob ? profile.dob.split('T')[0] : '')
            setEditJoining(joiningDate ? joiningDate.split('T')[0] : '')
            setIsEditProfileOpen(true)
          }}
          className="px-4 py-2 rounded-xl bg-coral text-ink text-xs font-bold hover:bg-[#E67E6B] transition-colors flex items-center gap-1.5 shadow-md"
        >
          <Edit3 className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs font-mono"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMsg}</p>
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-xs font-mono"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p>{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Profile Header Card ── */}
      <div className="glass-panel rounded-3xl p-8 border border-hairline relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, var(--coral) 0%, transparent 70%)' }}
        />

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          <div className="shrink-0">
            <AvatarUpload
              currentPhotoUrl={profile.avatar_url}
              userId={teacher.profile_id}
              size="xl"
              onUploadSuccess={() => router.refresh()}
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-parchment mb-2">{profile.full_name}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span
                  className="px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider text-veena-blue border border-veena-blue/30"
                  style={{ background: 'rgba(62,92,118,0.12)' }}
                >
                  {qualification || 'Teacher'}
                </span>
                {joiningDate && (
                  <span className="text-xs text-mist flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Joined: {formatDate(joiningDate)}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-mist pt-2 border-t border-hairline max-w-xl">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-coral shrink-0" />
                <span>{profile.mobile || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-coral shrink-0" />
                <span className="truncate">{profile.address || 'Address not specified'}</span>
              </div>
            </div>
          </div>

          {/* Quick Stat Pill */}
          <div className="shrink-0 flex md:flex-col gap-3 w-full md:w-auto">
            <div className="surface-card rounded-2xl p-4 border border-hairline flex-1 text-center md:text-right">
              <p className="text-xs text-mist font-mono uppercase tracking-wider">Attendance Rate</p>
              <p className="text-2xl font-bold text-emerald-400 font-display mt-1">
                {attendance.length > 0
                  ? `${Math.round((presentDays / attendance.length) * 100)}%`
                  : 'N/A'}
              </p>
              <p className="text-[10px] text-mist font-mono mt-0.5">{presentDays} Present · {absentDays} Absent</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-hairline pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-coral text-ink shadow-lg'
                  : 'text-mist hover:text-parchment hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab Contents ── */}
      <AnimatePresence mode="wait">
        {/* ── 1. OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Assigned Classes Card */}
            <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline space-y-6">
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-coral" />
                  <h3 className="font-display text-xl font-bold text-parchment">Assigned Classes</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssignClassesOpen(true)}
                  className="px-4 py-2 rounded-xl bg-veena-blue text-ink text-xs font-bold hover:bg-veena-blue/90 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Manage Assignments
                </button>
              </div>

              {teacherClasses.length === 0 ? (
                <p className="text-mist text-xs font-mono italic py-4">
                  No classes are currently assigned to this teacher.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {teacherClasses.map((tc, idx) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const cls = Array.isArray((tc as any).classes) ? (tc as any).classes[0] : (tc as any).classes
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-surface border border-hairline space-y-1 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold text-parchment">
                            {cls?.class_name} {cls?.section ? `(${cls.section})` : ''}
                          </p>
                          <p className="text-xs text-mist font-mono">Subject: {tc.subject}</p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="surface-card rounded-2xl p-5 border border-hairline">
                <span className="text-xs text-mist font-mono uppercase tracking-wider">Total Check-ins</span>
                <p className="text-2xl font-bold font-display text-parchment mt-1">{attendance.length}</p>
              </div>
              <div className="surface-card rounded-2xl p-5 border border-hairline">
                <span className="text-xs text-mist font-mono uppercase tracking-wider">Total Salary Paid</span>
                <p className="text-2xl font-bold font-display text-emerald-400 mt-1">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className="surface-card rounded-2xl p-5 border border-hairline">
                <span className="text-xs text-mist font-mono uppercase tracking-wider">Classes Handled</span>
                <p className="text-2xl font-bold font-display text-coral mt-1">{teacherClasses.length}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── 2. ATTENDANCE LOG TAB ── */}
        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline">
              <h3 className="font-display text-xl font-bold text-parchment">Daily Attendance Logs</h3>
              <p className="text-xs text-mist mt-1">
                View check-in time, photo verification, edit attendance status, or delete false entries.
              </p>
            </div>

            {attendance.length === 0 ? (
              <div className="surface-card rounded-2xl border border-hairline p-12 text-center text-mist italic text-sm">
                No attendance logs found for this teacher.
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {attendance
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((a) => (
                      <div key={a.id} className="surface-card rounded-2xl border border-hairline p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-parchment text-sm">{formatDate(a.date)}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              a.status === 'present'
                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                : a.status === 'absent'
                                ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                            }`}
                          >
                            {a.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-mist pt-2 border-t border-hairline">
                          <span>
                            Check In:{' '}
                            <strong className="text-parchment font-mono">
                              {a.check_in_at
                                ? new Date(a.check_in_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </strong>
                          </span>
                          {a.photo_url && (
                            <a
                              href={a.photo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-coral hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Photo
                            </a>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAttendance(a)}
                            className="px-3 py-1.5 rounded-lg bg-surface border border-hairline text-xs font-bold text-mist hover:text-parchment flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-coral" /> Edit Status
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttendance(a.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block surface-card rounded-2xl border border-hairline overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-hairline bg-ink/30">
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Date</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Check In Time</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Photo</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {attendance
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((a) => (
                          <tr key={a.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-medium text-parchment">{formatDate(a.date)}</td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                                  a.status === 'present'
                                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                    : a.status === 'absent'
                                    ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                    : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                }`}
                              >
                                {a.status}
                              </span>
                            </td>
                            <td className="p-4 text-mist text-sm font-mono">
                              {a.check_in_at
                                ? new Date(a.check_in_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </td>
                            <td className="p-4">
                              {a.photo_url ? (
                                <a
                                  href={a.photo_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-coral hover:underline text-sm flex items-center gap-1 font-mono"
                                >
                                  <FileText className="w-4 h-4" /> View
                                </a>
                              ) : (
                                <span className="text-mist text-xs">—</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAttendance(a)}
                                  className="px-2.5 py-1 rounded-lg bg-surface border border-hairline text-xs font-bold text-mist hover:text-parchment hover:border-coral/40 transition-colors flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-coral" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttendance(a.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                                  title="Delete Attendance Entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── 3. PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header & Add Payment Button */}
            <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-parchment">Salary & Payments History</h3>
                <p className="text-xs text-mist mt-1">
                  Total Paid: <strong className="text-emerald-400 font-mono">₹{totalPaid.toLocaleString()}</strong> across {payments.length} transactions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddPayment}
                className="px-6 py-3 rounded-xl bg-coral text-ink text-xs font-bold hover:bg-[#E67E6B] transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" /> Record Salary Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="surface-card rounded-2xl border border-hairline p-12 text-center text-mist italic text-sm">
                No payment transactions recorded for this teacher.
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {payments
                    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                    .map((p) => (
                      <div key={p.id} className="surface-card rounded-2xl border border-hairline p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-parchment text-sm">{formatDate(p.payment_date)}</span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">₹{p.amount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-mist pt-2 border-t border-hairline">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              p.status === 'paid'
                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                            }`}
                          >
                            {p.status}
                          </span>
                          <span className="truncate max-w-[160px]">{p.remarks || '—'}</span>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPayment(p)}
                            className="px-3 py-1.5 rounded-lg bg-surface border border-hairline text-xs font-bold text-mist hover:text-parchment flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-coral" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block surface-card rounded-2xl border border-hairline overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-hairline bg-ink/30">
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Date</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Amount</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Remarks</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {payments
                        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-medium text-parchment">{formatDate(p.payment_date)}</td>
                            <td className="p-4 font-bold text-emerald-400 font-mono">₹{p.amount}</td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                                  p.status === 'paid'
                                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                    : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="p-4 text-mist text-sm max-w-[200px] truncate">{p.remarks || '—'}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPayment(p)}
                                  className="px-2.5 py-1 rounded-lg bg-surface border border-hairline text-xs font-bold text-mist hover:text-parchment hover:border-coral/40 transition-colors flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-coral" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePayment(p.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                                  title="Delete Payment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT PROFILE
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditProfileOpen && (
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
                    <p className="text-xs text-mist font-mono">{teacher.teacher_id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
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
                      value={editQual}
                      onChange={(e) => setEditQual(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Mobile
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
                    <DateInput name="editJoining" value={editJoining} onChange={setEditJoining} />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
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
          MODAL: MANAGE ASSIGNED CLASSES
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAssignClassesOpen && (
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
                    <p className="text-xs text-mist">{profile.full_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssignClassesOpen(false)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {allAvailableClasses.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id)
                    return (
                      <div
                        key={cls.id}
                        onClick={() =>
                          setSelectedClassIds((prev) =>
                            prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                          )
                        }
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
                    onClick={() => setIsAssignClassesOpen(false)}
                    className="px-6 py-3 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClassAssignments}
                    disabled={isPending}
                    className="bg-veena-blue text-ink px-8 py-3 rounded-xl font-semibold text-sm hover:bg-veena-blue/90 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Assignments
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RECORD / EDIT PAYMENT
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-lg overflow-hidden bg-ink text-parchment"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center bg-ink/90">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-parchment">
                      {editingPaymentId ? 'Edit Payment Record' : 'Record Salary Payment'}
                    </h2>
                    <p className="text-xs text-mist">{profile.full_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 25000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment font-mono focus:outline-none focus:border-coral"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Payment Date
                    </label>
                    <DateInput name="paymentDate" value={paymentDate} onChange={setPaymentDate} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'pending')}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    >
                      <option value="paid" className="bg-ink text-parchment">Paid</option>
                      <option value="pending" className="bg-ink text-parchment">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                    Remarks / Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. August 2026 Salary via Bank Transfer"
                    value={paymentRemarks}
                    onChange={(e) => setPaymentRemarks(e.target.value)}
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-6 py-3 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-emerald-400 text-ink px-8 py-3 rounded-xl font-bold text-sm hover:bg-emerald-300 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingPaymentId ? 'Update Payment' : 'Save Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT ATTENDANCE STATUS
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingAttendance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-md overflow-hidden bg-ink text-parchment"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center bg-ink/90">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-parchment">Edit Attendance Status</h2>
                    <p className="text-xs text-mist font-mono">{formatDate(editingAttendance.date)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAttendance(null)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-2">
                    Select New Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['present', 'absent', 'late'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setAttendanceNewStatus(st)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                          attendanceNewStatus === st
                            ? st === 'present'
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-md'
                              : st === 'absent'
                              ? 'bg-red-500/20 border-red-400 text-red-400 shadow-md'
                              : 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-md'
                            : 'bg-surface border-hairline text-mist hover:border-mist'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setEditingAttendance(null)}
                    className="px-6 py-3 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAttendanceStatus}
                    disabled={isPending}
                    className="bg-coral text-ink px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#E67E6B] transition-colors flex items-center gap-2 shadow-lg"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Update Status
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
