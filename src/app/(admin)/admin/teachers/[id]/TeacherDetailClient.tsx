'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, UserCircle, Phone, Calendar, MapPin, IndianRupee, CheckCircle2, AlertCircle, Loader2, BookOpen, Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { recordTeacherPayment } from '@/actions/admin-details-actions'
import { getTeacherDetails } from '@/actions/user-management-actions'
import DateInput from '@/components/shared/DateInput'

export type TeacherDetailData = Exclude<Awaited<ReturnType<typeof getTeacherDetails>>['data'], null>

type TabType = 'overview' | 'attendance' | 'payments'

interface Props {
  teacher: TeacherDetailData
}

export default function TeacherDetailClient({ teacher }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'payments'>('overview')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

  const profile = teacher.profiles || {}
  const classes = teacher.teacher_classes || []
  const attendance = teacher.teacher_attendance || []
  const payments = teacher.teacher_payments || []

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const presentDays = attendance.filter((a) => a.status === 'present').length
  const absentDays = attendance.filter((a) => a.status === 'absent').length

  const formatDate = (d?: string | null) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    const fd = new FormData(e.currentTarget)
    fd.append('teacherId', teacher.id)
    startTransition(async () => {
      const res = await recordTeacherPayment(fd)
      if (res.error) setErrorMsg(res.error)
      else {
        setSuccessMsg('Payment recorded successfully.')
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview',    label: 'Overview',       icon: BookOpen },
    { id: 'attendance',  label: 'Attendance Log',  icon: Clock },
    { id: 'payments',    label: 'Payments',         icon: IndianRupee },
  ]

  return (
    <div className="space-y-6 pb-20">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-4">
        <Link href="/admin/teachers" className="p-2 rounded-xl surface-card border border-hairline hover:border-mist/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-parchment" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-parchment leading-tight">Teacher Profile</h1>
          <p className="text-coral text-sm font-mono tracking-wider">{teacher.teacher_id}</p>
        </div>
      </div>

      {/* ── Profile Header Card ── */}
      <div className="glass-panel rounded-3xl p-8 border border-hairline relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, var(--coral) 0%, transparent 70%)' }} />

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          <div className="shrink-0">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="Profile" width={128} height={128} className="rounded-2xl border-4 border-ink object-cover" />
            ) : (
              <div className="w-32 h-32 rounded-2xl flex items-center justify-center border border-hairline shadow-xl"
                style={{ background: 'rgba(62,92,118,0.12)' }}>
                <UserCircle className="w-20 h-20 text-veena-blue/60" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-parchment mb-2">{profile.full_name}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider text-veena-blue border border-veena-blue/30"
                  style={{ background: 'rgba(62,92,118,0.12)' }}>
                  {teacher.qualification || 'Teacher'}
                </span>
                <span className="text-mist text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Joined: {formatDate(teacher.joining_date)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 justify-center md:justify-start text-sm">
              <div className="flex items-center gap-2 text-mist">
                <Phone className="w-4 h-4 text-mist/50" />
                {profile.mobile || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-mist">
                <MapPin className="w-4 h-4 text-mist/50" />
                {profile.address || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-mist">
                <Calendar className="w-4 h-4 text-mist/50" />
                DOB: {formatDate(profile.dob)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="surface-card rounded-2xl p-1.5 flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === t.id ? 'text-ink' : 'text-mist hover:text-parchment'
            }`}
            style={activeTab === t.id ? { background: 'var(--coral)', boxShadow: '0 0 20px rgba(241,145,125,0.25)' } : {}}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Assigned Classes */}
              <div className="surface-card rounded-2xl p-6 border border-hairline">
                <h3 className="font-display text-lg font-bold text-parchment mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-veena-blue" /> Assigned Classes
                </h3>
                {classes.length > 0 ? (
                  <div className="space-y-3">
                    {classes.map((tc, i: number) => {
                      const clsArray = Array.isArray(tc.classes) ? tc.classes : tc.classes ? [tc.classes] : []
                      const clsStr = clsArray.map(c => `${c.class_name} ${c.section}`).join(', ')
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-hairline hover:border-coral/20 transition-colors">
                          <div>
                            <p className="font-bold text-parchment">{clsStr || 'N/A'}</p>
                            <p className="text-xs text-mist">{tc.subject}</p>
                          </div>
                          <span className="px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider text-veena-blue border border-veena-blue/30"
                            style={{ background: 'rgba(62,92,118,0.1)' }}>
                            {tc.subject}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-mist text-sm italic">No classes assigned yet.</p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="surface-card rounded-2xl p-6 border border-hairline space-y-4">
                <h3 className="font-display text-lg font-bold text-parchment mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="surface-card rounded-xl p-4 border border-hairline text-center">
                    <p className="text-mist text-xs font-bold uppercase tracking-wider mb-1">Present Days</p>
                    <p className="text-2xl font-bold text-emerald-400">{presentDays}</p>
                  </div>
                  <div className="surface-card rounded-xl p-4 border border-hairline text-center">
                    <p className="text-mist text-xs font-bold uppercase tracking-wider mb-1">Absent Days</p>
                    <p className="text-2xl font-bold text-red-400">{absentDays}</p>
                  </div>
                  <div className="surface-card rounded-xl p-4 border border-hairline col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-mist text-xs font-bold uppercase tracking-wider mb-1">Total Paid</p>
                      <p className="text-2xl font-bold text-parchment flex items-center">
                        <IndianRupee className="w-5 h-5 mr-1 text-gold" /> {totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center border border-gold/30"
                      style={{ background: 'rgba(212,175,106,0.1)' }}>
                      <IndianRupee className="w-6 h-6 text-gold" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ATTENDANCE */}
          {activeTab === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="surface-card rounded-2xl border border-hairline overflow-hidden">
              <div className="p-6 border-b border-hairline">
                <h3 className="font-display text-lg font-bold text-parchment">Attendance Log</h3>
                <p className="text-sm text-mist">Record of daily check-ins.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-hairline bg-ink/30">
                      <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Date</th>
                      <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Check In Time</th>
                      <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {attendance.length > 0 ? attendance
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((a) => (
                        <tr key={a.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-medium text-parchment">{formatDate(a.date)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                              a.status === 'present' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                              a.status === 'absent'  ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                                                        'text-amber-400 border-amber-500/30 bg-amber-500/10'
                            }`}>{a.status}</span>
                          </td>
                          <td className="p-4 text-mist text-sm">
                            {a.check_in_at ? new Date(a.check_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="p-4">
                            {a.photo_url ? (
                              <a href={a.photo_url} target="_blank" rel="noreferrer" className="text-coral hover:underline text-sm flex items-center gap-1">
                                <FileText className="w-4 h-4" /> View
                              </a>
                            ) : <span className="text-mist">—</span>}
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="p-8 text-center text-mist italic">No attendance records found.</td></tr>
                      )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* PAYMENTS */}
          {activeTab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Payment History */}
              <div className="lg:col-span-2 surface-card rounded-2xl border border-hairline overflow-hidden">
                <div className="p-6 border-b border-hairline">
                  <h3 className="font-display text-lg font-bold text-parchment">Payment History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-hairline bg-ink/30">
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Date</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Amount</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-bold text-mist uppercase tracking-wider">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {payments.length > 0 ? payments
                        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-medium text-parchment">{formatDate(p.payment_date)}</td>
                            <td className="p-4 font-bold text-emerald-400">₹{p.amount}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                                p.status === 'paid' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                              }`}>{p.status}</span>
                            </td>
                            <td className="p-4 text-mist text-sm max-w-[200px] truncate" title={p.remarks}>{p.remarks || '—'}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="p-8 text-center text-mist italic">No payments recorded yet.</td></tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Record Payment Form */}
              <div className="surface-card rounded-2xl p-6 border border-hairline self-start sticky top-6">
                <h3 className="font-display text-lg font-bold text-parchment mb-4">Record Payment</h3>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <p>{errorMsg}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> <p>{successMsg}</p>
                  </div>
                )}

                <form onSubmit={handleAddPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-1.5">Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
                      <input
                        type="number" name="amount" required min="1"
                        className="w-full bg-ink border border-hairline rounded-xl pl-9 pr-4 py-2.5 text-sm text-parchment focus:outline-none focus:border-coral/60 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-1.5">Payment Date</label>
                    <DateInput value={paymentDate} onChange={setPaymentDate} label="" labelClass="hidden" />
                    <input type="hidden" name="paymentDate" value={paymentDate} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-1.5">Remarks (Optional)</label>
                    <textarea
                      name="remarks" rows={2} placeholder="e.g. Salary for June"
                      className="w-full bg-ink border border-hairline rounded-xl px-4 py-2.5 text-sm text-parchment placeholder-mist/40 focus:outline-none focus:border-coral/60 transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit" disabled={isPending}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-ink transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--coral)' }}
                  >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Payment'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
