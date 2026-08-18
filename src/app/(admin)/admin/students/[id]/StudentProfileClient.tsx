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
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  IndianRupee,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { getStudentProfileData } from '@/actions/class-actions'
import {
  recordStudentFee,
  editStudentFee,
  deleteStudentFee,
  editStudentResult,
  deleteStudentResult,
} from '@/actions/admin-management-actions'
import DateInput from '@/components/shared/DateInput'

type StudentProfileDataPayload = Exclude<Awaited<ReturnType<typeof getStudentProfileData>>['data'], null>

interface StudentProfileProps {
  data: StudentProfileDataPayload
}

type TabType = 'details' | 'fees' | 'progress' | 'attendance'

export default function StudentProfileClient({ data }: StudentProfileProps) {
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

  // ── Fee Modals State ──
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false)
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null)
  const [feeName, setFeeName] = useState('')
  const [feeAmount, setFeeAmount] = useState<number | ''>('')
  const [feePaidAmount, setFeePaidAmount] = useState<number | ''>('')
  const [feeDueDate, setFeeDueDate] = useState(new Date().toISOString().split('T')[0])
  const [feeStatus, setFeeStatus] = useState<'paid' | 'partial' | 'pending'>('pending')

  // ── Result Modals State ──
  const [editingResult, setEditingResult] = useState<typeof results[0] | null>(null)
  const [resultMarks, setResultMarks] = useState<number | ''>('')
  const [resultTotal, setResultTotal] = useState<number | ''>('')
  const [resultSubject, setResultSubject] = useState('')

  // 3D Tilt effect handlers for ID card
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const box = card.getBoundingClientRect()
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    const centerX = box.width / 2
    const centerY = box.height / 2
    setRotateX(((y - centerY) / centerY) * -8)
    setRotateY(((x - centerX) / centerX) * 8)
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

  const attendancePct = attendanceStats.percentage
  const attendanceColor = attendancePct >= 75 ? 'var(--coral)' : attendancePct >= 50 ? '#D4AF6A' : '#EF4444'

  // Calculations for Fee
  const totalBilled = fees.reduce((sum, f) => sum + Number(f.amount), 0)
  const totalPaid = fees.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0)
  const totalDue = totalBilled - totalPaid

  // ── Fee Actions ──
  const handleOpenAddFee = () => {
    setEditingFeeId(null)
    setFeeName('')
    setFeeAmount('')
    setFeePaidAmount(0)
    setFeeDueDate(new Date().toISOString().split('T')[0])
    setFeeStatus('pending')
    setIsFeeModalOpen(true)
  }

  const handleOpenEditFee = (f: typeof fees[0]) => {
    setEditingFeeId(f.id)
    setFeeName(f.fee_name)
    setFeeAmount(f.amount)
    setFeePaidAmount(f.paid_amount || 0)
    setFeeDueDate(f.due_date ? f.due_date.split('T')[0] : new Date().toISOString().split('T')[0])
    setFeeStatus((f.status as 'paid' | 'partial' | 'pending') || 'pending')
    setIsFeeModalOpen(true)
  }

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feeName.trim() || feeAmount === '' || Number(feeAmount) <= 0) return
    setErrorMsg('')

    const numAmount = Number(feeAmount)
    const numPaid = Number(feePaidAmount) || 0
    let derivedStatus = feeStatus
    if (numPaid >= numAmount) derivedStatus = 'paid'
    else if (numPaid > 0) derivedStatus = 'partial'
    else derivedStatus = 'pending'

    startTransition(async () => {
      if (editingFeeId) {
        // Edit existing fee
        const res = await editStudentFee(editingFeeId, {
          fee_name: feeName.trim(),
          amount: numAmount,
          paid_amount: numPaid,
          due_date: feeDueDate,
          status: derivedStatus,
        })
        if (res.error) {
          setErrorMsg(res.error)
        } else {
          setFees((prev) =>
            prev.map((f) =>
              f.id === editingFeeId
                ? {
                    ...f,
                    fee_name: feeName.trim(),
                    amount: numAmount,
                    paid_amount: numPaid,
                    due_date: feeDueDate,
                    status: derivedStatus,
                  }
                : f
            )
          )
          setIsFeeModalOpen(false)
          setSuccessMsg('Fee record updated.')
          setTimeout(() => setSuccessMsg(''), 3000)
        }
      } else {
        // Record new fee
        const res = await recordStudentFee(student.student_id, {
          fee_name: feeName.trim(),
          amount: numAmount,
          paid_amount: numPaid,
          due_date: feeDueDate,
          status: derivedStatus,
        })
        if (res.error) {
          setErrorMsg(res.error)
        } else {
          setFees([
            {
              id: `fee-${Date.now()}`,
              student_id: student.student_id,
              fee_name: feeName.trim(),
              amount: numAmount,
              paid_amount: numPaid,
              due_date: feeDueDate,
              status: derivedStatus,
              created_at: new Date().toISOString(),
            },
            ...fees,
          ])
          setIsFeeModalOpen(false)
          setSuccessMsg('Fee record created.')
          setTimeout(() => setSuccessMsg(''), 3000)
        }
      }
    })
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

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'details', label: 'Details', icon: UserCircle },
    { id: 'fees', label: 'Fees & Invoices', icon: CreditCard },
    { id: 'progress', label: 'Progress', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarDays },
  ]

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-mist hover:text-parchment transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Students</span>
      </button>

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
        {/* LEFT COL: 3D Digital ID Card */}
        <div className="lg:col-span-1" style={{ perspective: '1000px' }}>
          <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ rotateX, rotateY }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer glass-panel"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* ID Card Header */}
            <div
              className="p-5 flex items-center justify-between border-b border-hairline"
              style={{
                background: 'linear-gradient(135deg, rgba(241,145,125,0.15) 0%, rgba(212,175,106,0.08) 100%)',
                transform: 'translateZ(20px)',
              }}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-coral" />
                <span className="font-display font-bold text-parchment tracking-wider text-sm">
                  STUDENT ID
                </span>
              </div>
              <span className="font-mono text-[10px] text-gold uppercase px-2 py-0.5 rounded border border-gold/30">
                {cls ? `${cls.class_name} - ${cls.section}` : 'N/A'}
              </span>
            </div>

            {/* ID Card Photo & Identity */}
            <div className="p-6 flex flex-col items-center text-center space-y-4" style={{ transform: 'translateZ(30px)' }}>
              <AvatarUpload
                currentPhotoUrl={profile?.profile_photo_url}
                userId={student.profile_id}
                size="lg"
                onUploadSuccess={() => router.refresh()}
              />

              <div>
                <h3 className="font-display text-xl font-bold text-parchment">
                  {profile?.full_name || 'Unnamed Student'}
                </h3>
                <p className="font-mono text-xs text-coral mt-1 font-bold">
                  Roll / ID: {student.student_id}
                </p>
              </div>

              {/* Quick Info Grid on ID Card */}
              <div className="w-full grid grid-cols-2 gap-2 pt-4 border-t border-hairline text-left">
                <div className="p-2.5 rounded-xl bg-ink/40 border border-hairline">
                  <span className="text-[10px] text-mist font-mono uppercase block">Admission</span>
                  <span className="text-xs font-bold text-parchment truncate block">
                    {formatDate(student.admission_date)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-ink/40 border border-hairline">
                  <span className="text-[10px] text-mist font-mono uppercase block">Attendance</span>
                  <span className="text-xs font-bold font-mono block" style={{ color: attendanceColor }}>
                    {attendancePct}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COL: Detailed Information & Management Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-hairline pb-2 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
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

          {/* ── 1. DETAILS TAB ── */}
          {activeTab === 'details' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline space-y-6">
                <h3 className="font-display text-xl font-bold text-parchment border-b border-hairline pb-4">
                  Personal & Family Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-mist uppercase tracking-wider block">
                      Father&apos;s Name
                    </span>
                    <p className="text-sm font-bold text-parchment">
                      {student.father_name || 'Not Recorded'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-mist uppercase tracking-wider block">
                      Mother&apos;s Name
                    </span>
                    <p className="text-sm font-bold text-parchment">
                      {student.mother_name || 'Not Recorded'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-mist uppercase tracking-wider block">
                      Date of Birth
                    </span>
                    <div className="flex items-center gap-2 text-sm text-parchment font-medium">
                      <Calendar className="w-4 h-4 text-coral" />
                      <span>{formatDate(profile?.dob)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-mist uppercase tracking-wider block">
                      Contact Mobile
                    </span>
                    <div className="flex items-center gap-2 text-sm text-parchment font-medium">
                      <Phone className="w-4 h-4 text-coral" />
                      <span>{profile?.mobile || 'No contact provided'}</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-xs font-mono text-mist uppercase tracking-wider block">
                      Residential Address
                    </span>
                    <div className="flex items-center gap-2 text-sm text-parchment font-medium">
                      <MapPin className="w-4 h-4 text-coral" />
                      <span>{profile?.address || 'No address on file'}</span>
                    </div>
                  </div>
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
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              f.status === 'paid'
                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                : f.status === 'partial'
                                ? 'text-gold border-gold/30 bg-gold/10'
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
                                    : f.status === 'partial'
                                    ? 'text-gold border-gold/30 bg-gold/10'
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
                            style={{ background: 'rgba(255,255,255,0.03)' }}
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

          {/* ── 4. ATTENDANCE TAB ── */}
          {activeTab === 'attendance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline space-y-6">
                <h3 className="font-display text-xl font-bold text-parchment">Attendance Overview</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-2xl bg-surface border border-hairline">
                    <span className="text-[10px] text-mist font-mono uppercase block">Present Days</span>
                    <span className="text-2xl font-bold font-display text-emerald-400 mt-1 block">
                      {attendanceStats.present}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface border border-hairline">
                    <span className="text-[10px] text-mist font-mono uppercase block">Total Sessions</span>
                    <span className="text-2xl font-bold font-display text-parchment mt-1 block">
                      {attendanceStats.total}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface border border-hairline">
                    <span className="text-[10px] text-mist font-mono uppercase block">Overall Percentage</span>
                    <span className="text-2xl font-bold font-display text-coral mt-1 block">
                      {attendancePct}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RECORD / EDIT STUDENT FEE
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isFeeModalOpen && (
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
                      {editingFeeId ? 'Edit Fee Record' : 'Record Fee Deposit'}
                    </h2>
                    <p className="text-xs text-mist">{profile?.full_name} · {student.student_id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFee} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                    Fee Title / Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Term 1 Tuition Fee, Annual Sports Fee"
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
                      onChange={(e) => setFeeAmount(e.target.value === '' ? '' : Number(e.target.value))}
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
                      onChange={(e) => setFeePaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment font-mono focus:outline-none focus:border-coral"
                    />
                  </div>
                </div>

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
                      onChange={(e) => setFeeStatus(e.target.value as 'paid' | 'partial' | 'pending')}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-coral"
                    >
                      <option value="paid" className="bg-ink text-parchment">Paid</option>
                      <option value="partial" className="bg-ink text-parchment">Partial</option>
                      <option value="pending" className="bg-ink text-parchment">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsFeeModalOpen(false)}
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
                    {editingFeeId ? 'Update Fee' : 'Save Fee Deposit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
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
    </div>
  )
}
