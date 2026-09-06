'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  BookOpen,
  CalendarDays,
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  IndianRupee,
  Clock,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { getStudentProfileData } from '@/actions/class-actions'
import { updateStudent } from '@/actions/user-management-actions'
import {
  recordStudentFee,
  editStudentFee,
  deleteStudentFee,
  editStudentResult,
  deleteStudentResult,
  editStudentAttendanceStatus,
  deleteStudentAttendance,
} from '@/actions/admin-management-actions'
import DateInput from '@/components/shared/DateInput'
import type { Database } from '@/types/supabase'

type StudentProfileDataPayload = Exclude<Awaited<ReturnType<typeof getStudentProfileData>>['data'], null>

interface ClassItem {
  id: string
  class_name: string
  section: string
}

interface StudentProfileProps {
  data: StudentProfileDataPayload
  classes: ClassItem[]
}

type TabType = 'details' | 'fees' | 'progress' | 'attendance'

export default function StudentProfileClient({ data, classes }: StudentProfileProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { student, attendanceStats } = data
  const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles
  const cls = Array.isArray(student.classes) ? student.classes[0] : student.classes

  // State for dynamic items
  const [fees, setFees] = useState(data.fees || [])
  const [results, setResults] = useState(data.results || [])
  const [attendanceLogs, setAttendanceLogs] = useState(data.attendanceLogs || [])

  // Student Profile state
  const [studentInfo, setStudentInfo] = useState({
    fullName: profile?.full_name || '',
    studentId: student.student_id || '',
    classId: student.class_id || '',
    className: cls ? `${cls.class_name} - ${cls.section}` : '',
    fatherName: student.father_name || '',
    motherName: student.mother_name || '',
    mobile: profile?.mobile || '',
    email: profile?.email || '',
    address: profile?.address || '',
    dob: profile?.dob ? profile.dob.split('T')[0] : '',
    admissionDate: student.admission_date ? student.admission_date.split('T')[0] : '',
  })

  // ── Edit Profile Modal State ──
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editFullName, setEditFullName] = useState(studentInfo.fullName)
  const [editStudentId, setEditStudentId] = useState(studentInfo.studentId)
  const [editClassId, setEditClassId] = useState(studentInfo.classId)
  const [editFatherName, setEditFatherName] = useState(studentInfo.fatherName)
  const [editMotherName, setEditMotherName] = useState(studentInfo.motherName)
  const [editMobile, setEditMobile] = useState(studentInfo.mobile)
  const [editAddress, setEditAddress] = useState(studentInfo.address)
  const [editDob, setEditDob] = useState(studentInfo.dob)

  // ── Fee Modals State ──
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false)
  const [selectedFee, setSelectedFee] = useState<typeof fees[0] | null>(null)

  // ── Result Modals State ──
  const [editingResult, setEditingResult] = useState<typeof results[0] | null>(null)
  const [resultMarks, setResultMarks] = useState<number | ''>('')
  const [resultTotal, setResultTotal] = useState<number | ''>('')
  const [resultSubject, setResultSubject] = useState('')

  // ── Attendance Status Edit Modal State ──
  const [editingAttendance, setEditingAttendance] = useState<typeof attendanceLogs[0] | null>(null)
  const [attendanceNewStatus, setAttendanceNewStatus] = useState<Database['public']['Enums']['attendance_status']>('present')

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const presentDays = attendanceLogs.filter((a) => a.status === 'present').length
  const totalAttSessions = attendanceLogs.length
  const attendancePct = totalAttSessions === 0 ? attendanceStats.percentage : Math.round((presentDays / totalAttSessions) * 100)
  const attendanceColor = attendancePct >= 75 ? 'var(--coral)' : attendancePct >= 50 ? '#D4AF6A' : '#EF4444'

  // Calculations for Fee
  const totalBilled = fees.reduce((sum, f) => sum + Number(f.amount), 0)
  const totalPaid = fees.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0)
  const totalDue = totalBilled - totalPaid

  // ── Profile Edit Handler ──
  const handleOpenEditProfile = () => {
    setEditFullName(studentInfo.fullName)
    setEditStudentId(studentInfo.studentId)
    setEditClassId(studentInfo.classId)
    setEditFatherName(studentInfo.fatherName)
    setEditMotherName(studentInfo.motherName)
    setEditMobile(studentInfo.mobile)
    setEditAddress(studentInfo.address)
    setEditDob(studentInfo.dob)
    setIsEditProfileOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const fd = new FormData()
    fd.append('profileId', student.profile_id)
    fd.append('fullName', editFullName.trim())
    fd.append('studentId', editStudentId.trim())
    fd.append('classId', editClassId)
    fd.append('fatherName', editFatherName.trim())
    fd.append('motherName', editMotherName.trim())
    fd.append('phone', editMobile.trim())
    fd.append('address', editAddress.trim())
    fd.append('dob', editDob)

    startTransition(async () => {
      const res = await updateStudent(fd)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        const selectedCls = classes.find((c) => c.id === editClassId)
        setStudentInfo({
          fullName: editFullName,
          studentId: editStudentId,
          classId: editClassId,
          className: selectedCls ? `${selectedCls.class_name} - ${selectedCls.section}` : studentInfo.className,
          fatherName: editFatherName,
          motherName: editMotherName,
          mobile: editMobile,
          email: studentInfo.email,
          address: editAddress,
          dob: editDob,
          admissionDate: studentInfo.admissionDate,
        })
        setIsEditProfileOpen(false)
        setSuccessMsg('Student profile updated successfully.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  // ── Fee Actions ──
  const handleOpenAddFee = () => {
    setSelectedFee(null)
    setIsFeeModalOpen(true)
  }

  const handleOpenEditFee = (f: typeof fees[0]) => {
    setSelectedFee(f)
    setIsFeeModalOpen(true)
  }

  const handleSaveFeeRecord = async (payload: {
    feeName: string
    amount: number
    paidAmount: number
    dueDate: string
    status: 'paid' | 'due' | 'upcoming'
  }): Promise<{ success: boolean; error?: string }> => {
    setErrorMsg('')
    if (selectedFee) {
      // Edit existing fee
      const res = await editStudentFee(selectedFee.id, {
        fee_name: payload.feeName,
        amount: payload.amount,
        paid_amount: payload.paidAmount,
        due_date: payload.dueDate,
        status: payload.status,
      })
      if (res.error) {
        return { success: false, error: res.error }
      }
      setFees((prev) =>
        prev.map((f) =>
          f.id === selectedFee.id
            ? {
                ...f,
                fee_name: payload.feeName,
                amount: payload.amount,
                paid_amount: payload.paidAmount,
                due_date: payload.dueDate,
                status: payload.status,
              }
            : f
        )
      )
      setIsFeeModalOpen(false)
      setSuccessMsg('Fee record updated.')
      setTimeout(() => setSuccessMsg(''), 3000)
      return { success: true }
    } else {
      // Record new fee
      const res = await recordStudentFee(studentInfo.studentId, {
        fee_name: payload.feeName,
        amount: payload.amount,
        paid_amount: payload.paidAmount,
        due_date: payload.dueDate,
        status: payload.status,
      })
      if (res.error || !res.data) {
        return { success: false, error: res.error || 'Failed to record fee' }
      }
      setFees([res.data, ...fees])
      setIsFeeModalOpen(false)
      setSuccessMsg('Fee record created.')
      setTimeout(() => setSuccessMsg(''), 3000)
      return { success: true }
    }
  }

  const handleDeleteFee = (id: string) => {
    if (!confirm('Are you sure you want to delete this fee record?')) return

    startTransition(async () => {
      const res = await deleteStudentFee(id)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setFees((prev) => prev.filter((f) => f.id !== id))
        setSuccessMsg('Fee record deleted.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  // ── Result Actions ──
  const handleOpenEditResult = (res: typeof results[0]) => {
    setEditingResult(res)
    setResultMarks(res.marks_obtained)
    setResultTotal(res.total_marks || res.max_marks || 100)
    setResultSubject(res.subject)
  }

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingResult || resultMarks === '') return
    setErrorMsg('')

    startTransition(async () => {
      const res = await editStudentResult(editingResult.id, {
        marks_obtained: Number(resultMarks),
        total_marks: resultTotal === '' ? undefined : Number(resultTotal),
        subject: resultSubject,
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.id === editingResult.id
              ? {
                  ...r,
                  marks_obtained: Number(resultMarks),
                  total_marks: resultTotal === '' ? r.total_marks : Number(resultTotal),
                  subject: resultSubject,
                }
              : r
          )
        )
        setEditingResult(null)
        setSuccessMsg('Result updated successfully.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  const handleDeleteResult = (resultId: string) => {
    if (!confirm('Are you sure you want to delete this test / exam result?')) return

    startTransition(async () => {
      const res = await deleteStudentResult(resultId)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setResults((prev) => prev.filter((r) => r.id !== resultId))
        setSuccessMsg('Result deleted.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  // ── Student Attendance Actions (Edit Status & Delete) ──
  const handleOpenEditAttendance = (att: typeof attendanceLogs[0]) => {
    setEditingAttendance(att)
    setAttendanceNewStatus(att.status as Database['public']['Enums']['attendance_status'])
  }

  const handleSaveAttendanceStatus = async () => {
    if (!editingAttendance) return
    setErrorMsg('')

    startTransition(async () => {
      const res = await editStudentAttendanceStatus(editingAttendance.id, attendanceNewStatus)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setAttendanceLogs((prev) =>
          prev.map((a) => (a.id === editingAttendance.id ? { ...a, status: attendanceNewStatus } : a))
        )
        setEditingAttendance(null)
        setSuccessMsg('Student attendance status updated.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  const handleDeleteAttendance = (id: string) => {
    if (!confirm('Are you sure you want to delete this student attendance record?')) return

    startTransition(async () => {
      const res = await deleteStudentAttendance(id)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setAttendanceLogs((prev) => prev.filter((a) => a.id !== id))
        setSuccessMsg('Attendance record deleted.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'details', label: 'Details', icon: UserCircle },
    { id: 'fees', label: 'Fees & Invoices', icon: CreditCard },
    { id: 'progress', label: 'Progress', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarDays },
  ]

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-mist hover:text-parchment transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Students</span>
        </button>

        <button
          type="button"
          onClick={handleOpenEditProfile}
          className="px-5 py-2.5 rounded-xl bg-coral text-ink text-xs font-bold hover:bg-[#E67E6B] transition-colors flex items-center gap-2 shadow-md"
        >
          <Edit3 className="w-4 h-4" /> Edit Student Data
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── LEFT COL: DIGITAL ID CARD ── */}
        <div className="lg:col-span-1">
          <div className="relative rounded-2xl overflow-hidden surface-card border border-hairline shadow-md">
            {/* ID Card Header */}
            <div className="p-5 flex items-center justify-between border-b border-hairline bg-coral/10">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-coral" />
                <span className="font-display font-bold text-parchment tracking-wider text-sm">
                  STUDENT ID
                </span>
              </div>
              <div
                className="w-8 h-8 rounded-full overflow-hidden border border-coral/30 flex-shrink-0 flex items-center justify-center bg-coral/10"
              >
                <Image src="/icon-192.png" alt="RMSPS Logo" width={32} height={32} className="object-cover" />
              </div>
            </div>

            {/* ID Card Photo & Identity */}
            <div className="p-6 flex flex-col items-center relative">
              <div className="relative mb-5">
                <AvatarUpload
                  currentPhotoUrl={profile?.profile_photo_url}
                  userId={student.profile_id}
                  size="xl"
                  onUploadSuccess={() => router.refresh()}
                />
                <div className="absolute -bottom-3 -right-3 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-coral/30 text-coral bg-ink shadow-md">
                  {studentInfo.className || 'CLASS'}
                </div>
              </div>

              <h2 className="font-display text-xl font-bold text-parchment mb-1 text-center leading-tight">
                {studentInfo.fullName?.toUpperCase() || 'STUDENT NAME'}
              </h2>
              <p className="font-mono text-sm tracking-widest mb-6" style={{ color: 'var(--coral)' }}>
                {studentInfo.studentId}
              </p>

              {/* Personal Details Table on ID Card */}
              <div className="w-full space-y-3 text-xs">
                {[
                  { label: 'D.O.B', value: formatDate(studentInfo.dob) },
                  { label: 'FATHER', value: studentInfo.fatherName || 'N/A' },
                  { label: 'MOTHER', value: studentInfo.motherName || 'N/A' },
                  { label: 'PHONE', value: studentInfo.mobile || 'N/A' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between border-b border-hairline pb-2">
                    <span className="text-mist font-mono tracking-wider">{row.label}</span>
                    <span className="text-parchment font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer — Barcode */}
            <div className="px-6 pb-5 flex items-center justify-center border-t border-hairline">
              <div className="w-3/4 h-8 flex items-end justify-between opacity-20 mt-4">
                {[...Array(22)].map((_, i) => (
                  <div
                    key={i}
                    className={`bg-parchment ${
                      i % 3 === 0 ? 'h-full w-[3px]' : i % 2 === 0 ? 'h-3/4 w-[1px]' : 'h-full w-[1px]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COL: DATA SECTIONS & MANAGEMENT TABS ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="surface-card rounded-2xl p-1.5 flex flex-wrap gap-1 border border-hairline">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'text-ink font-bold shadow-lg' : 'text-mist hover:text-parchment'
                  }`}
                  style={
                    isActive
                      ? { background: 'var(--coral)', boxShadow: '0 0 20px rgba(241,145,125,0.25)' }
                      : {}
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* ── 1. DETAILS TAB ── */}
          {activeTab === 'details' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline space-y-6">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <h3 className="font-display text-xl font-bold text-parchment">Personal Details</h3>
                  <button
                    type="button"
                    onClick={handleOpenEditProfile}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] text-ink bg-coral shadow-md"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Student Data
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: UserCircle, label: 'Full Name', value: studentInfo.fullName },
                    { icon: GraduationCap, label: 'Roll / Student ID', value: studentInfo.studentId },
                    { icon: BookOpen, label: 'Class & Section', value: studentInfo.className || 'N/A' },
                    { icon: Calendar, label: 'Date of Birth', value: formatDate(studentInfo.dob) },
                    { icon: UserCircle, label: "Father's Name", value: studentInfo.fatherName || 'N/A' },
                    { icon: UserCircle, label: "Mother's Name", value: studentInfo.motherName || 'N/A' },
                    { icon: Phone, label: 'Primary Phone', value: studentInfo.mobile || 'N/A' },
                    { icon: Mail, label: 'Email Address', value: studentInfo.email || 'N/A', wide: false },
                    {
                      icon: MapPin,
                      label: 'Residential Address',
                      value: studentInfo.address || 'No address provided.',
                      wide: true,
                    },
                  ].map((item, idx) => (
                    <div key={idx} className={item.wide ? 'md:col-span-2' : ''}>
                      <span className="text-xs text-mist uppercase font-semibold tracking-wider flex items-center gap-1.5 mb-1">
                        <item.icon className="w-3.5 h-3.5 text-coral" /> {item.label}
                      </span>
                      <p className="text-parchment font-medium text-base break-all">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 2. FEES TAB ── */}
          {activeTab === 'fees' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Fee Metric Cards & Add Button */}
              <div className="surface-card rounded-3xl p-6 border border-hairline space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-parchment">Student Fees & Invoices</h3>
                    <p className="text-xs text-mist mt-0.5">Manage tuition, admission, and exam fee deposits.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddFee}
                    className="px-5 py-2.5 rounded-xl bg-coral text-ink text-xs font-bold hover:bg-[#E67E6B] transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Plus className="w-4 h-4" /> Record Fee Deposit
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-surface border border-hairline text-center">
                    <span className="text-[10px] text-mist font-mono uppercase block">Total Invoiced</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-parchment mt-1 block">
                      ₹{totalBilled.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface border border-hairline text-center">
                    <span className="text-[10px] text-mist font-mono uppercase block">Total Paid</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-1 block">
                      ₹{totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface border border-hairline text-center">
                    <span className="text-[10px] text-mist font-mono uppercase block">Due / Balance</span>
                    <span
                      className={`text-base sm:text-lg font-bold font-mono mt-1 block ${
                        totalDue > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      ₹{totalDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fee List */}
              {fees.length === 0 ? (
                <div className="surface-card rounded-2xl border border-hairline p-12 text-center text-mist italic text-sm">
                  No fee records found for this student. Click &ldquo;Record Fee Deposit&rdquo; to add one.
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="sm:hidden space-y-3">
                    {fees.map((f) => (
                      <div key={f.id} className="surface-card rounded-2xl border border-hairline p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-parchment text-sm">{f.fee_name}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              f.status === 'paid'
                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                : f.status === 'upcoming'
                                ? 'text-veena-blue border-veena-blue/30 bg-veena-blue/10'
                                : 'text-red-400 border-red-500/30 bg-red-500/10'
                            }`}
                          >
                            {f.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-mist pt-2 border-t border-hairline font-mono">
                          <span>Amount: <strong>₹{f.amount}</strong></span>
                          <span>Paid: <strong className="text-emerald-400">₹{f.paid_amount || 0}</strong></span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-mist">
                          <span>Due Date: {formatDate(f.due_date)}</span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditFee(f)}
                              className="px-2.5 py-1 rounded-lg bg-surface border border-hairline text-xs font-bold text-mist hover:text-parchment"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-coral inline mr-1" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFee(f.id)}
                              className="p-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30"
                              title="Delete Fee"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block surface-card rounded-2xl border border-hairline overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-hairline bg-ink/30">
                          <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Fee Name</th>
                          <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Total Amount</th>
                          <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Paid Amount</th>
                          <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Due Date</th>
                          <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Status</th>
                          <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {fees.map((f) => (
                          <tr key={f.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-medium text-parchment">{f.fee_name}</td>
                            <td className="p-4 font-bold text-parchment font-mono">₹{f.amount}</td>
                            <td className="p-4 font-bold text-emerald-400 font-mono">₹{f.paid_amount || 0}</td>
                            <td className="p-4 text-mist text-xs font-mono">{formatDate(f.due_date)}</td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                                  f.status === 'paid'
                                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                    : f.status === 'upcoming'
                                    ? 'text-veena-blue border-veena-blue/30 bg-veena-blue/10'
                                    : 'text-red-400 border-red-500/30 bg-red-500/10'
                                }`}
                              >
                                {f.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditFee(f)}
                                  className="px-2.5 py-1 rounded-lg bg-surface border border-hairline text-xs font-bold text-mist hover:text-parchment hover:border-coral/40 transition-colors flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-coral" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFee(f.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                                  title="Delete Fee Record"
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

          {/* ── 3. PROGRESS TAB ── */}
          {activeTab === 'progress' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h3 className="font-display text-xl font-bold text-parchment border-b border-hairline pb-4">
                Academic Progress & Exam Results
              </h3>

              {results.length === 0 ? (
                <div className="surface-card rounded-2xl border border-hairline p-12 text-center text-mist italic text-sm">
                  No exam or test results have been recorded for this student yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((res) => {
                    const total = res.total_marks || res.max_marks || 100
                    const pct = (res.marks_obtained / total) * 100
                    let calculatedGrade = 'F'
                    if (pct >= 90) calculatedGrade = 'A+'
                    else if (pct >= 80) calculatedGrade = 'A'
                    else if (pct >= 70) calculatedGrade = 'B+'
                    else if (pct >= 60) calculatedGrade = 'B'
                    else if (pct >= 50) calculatedGrade = 'C'
                    else if (pct >= 40) calculatedGrade = 'D'

                    const gradeColor =
                      pct >= 75
                        ? 'text-emerald-400 border-emerald-500/30'
                        : pct >= 50
                        ? 'text-gold border-gold/30'
                        : 'text-red-400 border-red-500/30'

                    return (
                      <div
                        key={res.id}
                        className="surface-card rounded-2xl border border-hairline p-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-bold text-parchment capitalize">
                            {res.exam_type.replace('_', ' ')} · {res.subject}
                          </p>
                          <p className="text-xs text-mist font-mono mt-0.5">
                            Marks: <strong className="text-parchment">{res.marks_obtained}</strong> / {total} ({pct.toFixed(1)}%)
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${gradeColor}`}
                            style={{ background: 'rgba(255,255,200,0.03)' }}
                          >
                            {calculatedGrade}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditResult(res)}
                            className="p-2 rounded-xl bg-surface border border-hairline text-mist hover:text-parchment hover:border-coral/40"
                            title="Edit Result"
                          >
                            <Edit3 className="w-4 h-4 text-coral" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteResult(res.id)}
                            className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                            title="Delete Result"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── 4. ATTENDANCE TAB (RICH SUMMARY + DAILY RECORDS WITH EDIT/DELETE) ── */}
          {activeTab === 'attendance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h3 className="font-display text-xl font-bold text-parchment border-b border-hairline pb-4">
                Attendance Summary
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total Sessions',
                    value: totalAttSessions || attendanceStats.total,
                    color: 'text-mist',
                    bg: 'rgba(138,143,152,0.06)',
                  },
                  {
                    label: 'Present Days',
                    value: presentDays || attendanceStats.present,
                    color: 'text-emerald-400',
                    bg: 'rgba(16,185,129,0.06)',
                  },
                  {
                    label: 'Absent Days',
                    value: (totalAttSessions || attendanceStats.total) - (presentDays || attendanceStats.present),
                    color: 'text-red-400',
                    bg: 'rgba(239,68,68,0.06)',
                  },
                  {
                    label: 'Percentage',
                    value: `${attendancePct}%`,
                    color: 'text-coral',
                    bg: 'rgba(241,145,125,0.06)',
                  },
                ].map((stat) => (
                  <div key={stat.label} className="surface-card rounded-2xl p-4 text-center border border-hairline">
                    <p className="text-xs text-mist font-semibold mb-2 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Attendance Rate Bar */}
              <div className="surface-card rounded-2xl p-5 border border-hairline">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-mist">Attendance Rate</span>
                  <span className="text-sm font-bold font-mono" style={{ color: attendanceColor }}>
                    {attendancePct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-ink border border-hairline overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${attendancePct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${attendanceColor}, ${attendanceColor}80)` }}
                  />
                </div>
                <p className="text-xs text-mist mt-3 text-center">
                  {attendancePct >= 75
                    ? '✓ Attendance is satisfactory'
                    : attendancePct >= 50
                    ? '⚠ Attendance is below recommended level'
                    : '✗ Attendance is critically low — action required'}
                </p>
              </div>

              {/* Daily Records List */}
              <div className="surface-card rounded-3xl p-6 border border-hairline space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-coral" />
                  <h4 className="font-display text-lg font-bold text-parchment">Daily Attendance Logs</h4>
                </div>

                {attendanceLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center border border-hairline rounded-2xl bg-white/[0.02]">
                    <CalendarDays className="w-10 h-10 text-mist/30 mb-3" />
                    <p className="text-mist text-sm max-w-md">
                      No individual daily attendance logs recorded yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-hairline bg-ink/30">
                          <th className="p-3 text-xs font-bold text-mist uppercase tracking-wider">Date</th>
                          <th className="p-3 text-xs font-bold text-mist uppercase tracking-wider">Status</th>
                          <th className="p-3 text-xs font-bold text-mist uppercase tracking-wider text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {attendanceLogs.map((att) => (
                          <tr key={att.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3 font-medium text-parchment text-sm">{formatDate(att.date)}</td>
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
                                  att.status === 'present'
                                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                    : att.status === 'absent'
                                    ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                    : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                }`}
                              >
                                {att.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAttendance(att)}
                                  className="px-2.5 py-1 rounded-lg bg-surface border border-hairline text-xs font-bold text-mist hover:text-parchment hover:border-coral/40 transition-colors flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-coral" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttendance(att.id)}
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
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT STUDENT PROFILE
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
                    <h2 className="font-display text-xl font-bold text-parchment">Edit Student Profile</h2>
                    <p className="text-xs text-mist font-mono">{studentInfo.studentId}</p>
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
                  <div>
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
                      Roll / Student ID
                    </label>
                    <input
                      type="text"
                      required
                      value={editStudentId}
                      onChange={(e) => setEditStudentId(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment font-mono focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Class & Section
                    </label>
                    <select
                      value={editClassId}
                      onChange={(e) => setEditClassId(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id} className="bg-ink text-parchment">
                          {c.class_name} {c.section ? `- Section ${c.section}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Father&apos;s Name
                    </label>
                    <input
                      type="text"
                      value={editFatherName}
                      onChange={(e) => setEditFatherName(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Mother&apos;s Name
                    </label>
                    <input
                      type="text"
                      value={editMotherName}
                      onChange={(e) => setEditMotherName(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Contact Mobile
                    </label>
                    <input
                      type="tel"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Date of Birth
                    </label>
                    <DateInput name="editDob" value={editDob} onChange={setEditDob} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    />
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
                    className="bg-coral text-ink px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#E67E6B] transition-colors flex items-center gap-2 shadow-lg"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RECORD / EDIT STUDENT FEE
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFeeModalOpen && (
          <FeeRecordModal
            key={selectedFee?.id || 'new'}
            isOpen={isFeeModalOpen}
            onClose={() => setIsFeeModalOpen(false)}
            editingFee={selectedFee}
            studentName={studentInfo.fullName}
            studentId={studentInfo.studentId}
            onSave={handleSaveFeeRecord}
          />
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT STUDENT RESULT
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingResult && (
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
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-parchment">Edit Result Marks</h2>
                    <p className="text-xs text-mist capitalize">{editingResult.exam_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveResult} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={resultSubject}
                    onChange={(e) => setResultSubject(e.target.value)}
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Marks Obtained
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={resultMarks}
                      onChange={(e) => setResultMarks(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment font-mono focus:outline-none focus:border-coral"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={resultTotal}
                      onChange={(e) => setResultTotal(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment font-mono focus:outline-none focus:border-coral"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setEditingResult(null)}
                    className="px-6 py-3 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-coral text-ink px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#E67E6B] transition-colors flex items-center gap-2 shadow-lg"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Update Result
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT STUDENT ATTENDANCE STATUS
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

/* ══════════════════════════════════════════════════════════════
   ISOLATED MODAL: RECORD / EDIT STUDENT FEE
   Isolating form state prevents re-rendering the 1,400-line dashboard on every keystroke
   ══════════════════════════════════════════════════════════════ */
interface FeeRecordModalProps {
  isOpen: boolean
  onClose: () => void
  editingFee: StudentProfileDataPayload['fees'][0] | null
  studentName: string
  studentId: string
  onSave: (payload: {
    feeName: string
    amount: number
    paidAmount: number
    dueDate: string
    status: 'paid' | 'due' | 'upcoming'
  }) => Promise<{ success: boolean; error?: string }>
}

function FeeRecordModal({
  isOpen,
  onClose,
  editingFee,
  studentName,
  studentId,
  onSave,
}: FeeRecordModalProps) {
  const [feeName, setFeeName] = useState(editingFee ? editingFee.fee_name : '')
  const [feeAmount, setFeeAmount] = useState<number | ''>(editingFee ? editingFee.amount : '')
  const [feePaidAmount, setFeePaidAmount] = useState<number | ''>(
    editingFee ? (editingFee.paid_amount || 0) : ''
  )
  const [feeDueDate, setFeeDueDate] = useState(
    editingFee?.due_date ? editingFee.due_date.split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [feeStatus, setFeeStatus] = useState<'paid' | 'due' | 'upcoming'>(
    (editingFee?.status as 'paid' | 'due' | 'upcoming') || 'due'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feeName.trim() || feeAmount === '' || Number(feeAmount) <= 0) return
    setModalError('')
    setIsSubmitting(true)

    const numAmount = Number(feeAmount)
    const numPaid = Number(feePaidAmount) || 0
    let targetStatus: 'paid' | 'due' | 'upcoming' = feeStatus

    if (numPaid >= numAmount && numAmount > 0) {
      targetStatus = 'paid'
    } else if (targetStatus === 'paid' && numPaid < numAmount) {
      targetStatus = 'due'
    }

    const res = await onSave({
      feeName: feeName.trim(),
      amount: numAmount,
      paidAmount: numPaid,
      dueDate: feeDueDate,
      status: targetStatus,
    })

    setIsSubmitting(false)
    if (res.error) {
      setModalError(res.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-lg overflow-hidden bg-ink text-parchment"
      >
        <div className="p-6 border-b border-hairline flex justify-between items-center bg-ink/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-parchment">
                {editingFee ? 'Edit Fee Record' : 'Record Fee Deposit'}
              </h2>
              <p className="text-xs text-mist">{studentName} · {studentId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-mist hover:text-coral transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
              Fee Title / Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tuition Fee Q1, Annual Sports Fee"
              value={feeName}
              onChange={(e) => setFeeName(e.target.value)}
              className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                Total Amount (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 5000"
                value={feeAmount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value)
                  setFeeAmount(val)
                  const numTot = Number(val) || 0
                  const numP = Number(feePaidAmount) || 0
                  if (numTot > 0 && numP >= numTot) {
                    setFeeStatus('paid')
                  } else if (numTot > 0 && numP < numTot && feeStatus === 'paid') {
                    setFeeStatus('due')
                  }
                }}
                className="w-full input-glass rounded-xl p-3 text-sm text-parchment font-mono focus:outline-none focus:border-coral"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={feePaidAmount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value)
                  setFeePaidAmount(val)
                  const numP = Number(val) || 0
                  const numTot = Number(feeAmount) || 0
                  if (numTot > 0 && numP >= numTot) {
                    setFeeStatus('paid')
                  } else if (numTot > 0 && numP < numTot && feeStatus === 'paid') {
                    setFeeStatus('due')
                  }
                }}
                className="w-full input-glass rounded-xl p-3 text-sm text-parchment font-mono focus:outline-none focus:border-coral"
              />
            </div>
          </div>

          {feeAmount !== '' && Number(feeAmount) > 0 && (
            <div className="flex justify-between items-center text-xs px-3 py-2 rounded-xl bg-surface/80 border border-hairline/60 font-mono">
              <span className="text-mist">Remaining Balance:</span>
              <span className={Math.max(0, Number(feeAmount) - (Number(feePaidAmount) || 0)) > 0 ? 'text-coral font-bold' : 'text-emerald-400 font-bold'}>
                ₹{Math.max(0, Number(feeAmount) - (Number(feePaidAmount) || 0)).toLocaleString('en-IN')}
                {(Number(feePaidAmount) || 0) > 0 && (Number(feePaidAmount) || 0) < Number(feeAmount) && ' · Partial Deposit'}
                {Number(feeAmount) > 0 && (Number(feePaidAmount) || 0) >= Number(feeAmount) && ' · Fully Cleared'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                Due Date
              </label>
              <DateInput name="feeDueDate" value={feeDueDate} onChange={setFeeDueDate} />
            </div>

            <div>
              <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={feeStatus}
                onChange={(e) => setFeeStatus(e.target.value as 'paid' | 'due' | 'upcoming')}
                className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral cursor-pointer"
              >
                <option value="due" className="bg-ink text-parchment">Due</option>
                <option value="paid" className="bg-ink text-parchment">Paid</option>
                <option value="upcoming" className="bg-ink text-parchment">Upcoming</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-coral text-ink px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#E67E6B] transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editingFee ? 'Update Fee' : 'Save Fee Deposit'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
