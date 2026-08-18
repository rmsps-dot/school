'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit3,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GraduationCap,
  TrendingUp,
  User,
} from 'lucide-react'
import DateInput from '@/components/shared/DateInput'
import {
  submitProfileChangeRequest,
  type ProfileChangeRequestItem,
} from '@/actions/profile-request-actions'
import type { ChildInfo } from '@/actions/portal-actions'

interface Props {
  parentProfile: {
    id: string
    full_name: string | null
    mobile: string | null
    address: string | null
    dob: string | null
  } | null
  children: ChildInfo[]
  initialPendingRequest: ProfileChangeRequestItem | null
}

export default function ParentProfileCard({
  parentProfile,
  children,
  initialPendingRequest,
}: Props) {
  const [pendingReq, setPendingReq] = useState<ProfileChangeRequestItem | null>(initialPendingRequest)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form State for Guardian
  const [fullName, setFullName] = useState(parentProfile?.full_name || '')
  const [mobile, setMobile] = useState(parentProfile?.mobile || '')
  const [address, setAddress] = useState(parentProfile?.address || '')
  const [dob, setDob] = useState(parentProfile?.dob ? parentProfile.dob.split('T')[0] : '')

  const handleOpenModal = () => {
    setFullName(parentProfile?.full_name || '')
    setMobile(parentProfile?.mobile || '')
    setAddress(parentProfile?.address || '')
    setDob(parentProfile?.dob ? parentProfile.dob.split('T')[0] : '')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const current_data = {
      fullName: parentProfile?.full_name || null,
      mobile: parentProfile?.mobile || null,
      address: parentProfile?.address || null,
      dob: parentProfile?.dob || null,
    }

    const requested_data = {
      fullName: fullName.trim(),
      mobile: mobile.trim() || null,
      address: address.trim() || null,
      dob: dob || null,
    }

    const primaryChildClassId = children[0]?.classId || null

    startTransition(async () => {
      const res = await submitProfileChangeRequest({
        role: 'parent',
        class_id: primaryChildClassId,
        current_data,
        requested_data,
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setPendingReq({
          id: 'temp-' + Date.now(),
          user_id: '',
          role: 'parent',
          class_id: primaryChildClassId,
          target_approver: 'teacher',
          current_data,
          requested_data,
          status: 'pending',
          review_notes: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: new Date().toISOString(),
        })
        setIsModalOpen(false)
        setSuccessMsg('Guardian details update request submitted for Class Teacher / Admin approval.')
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    })
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-mono"
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
            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-mono"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p>{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Banner */}
      {pendingReq && pendingReq.status === 'pending' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="surface-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 flex items-start gap-3"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 text-xs space-y-0.5">
            <p className="font-bold text-amber-300">Guardian Update Request Pending</p>
            <p className="text-mist text-[11px]">
              Your details update request is currently pending review by your child&apos;s Class Teacher / Admin.
            </p>
          </div>
        </motion.div>
      )}

      {/* Guardian Quick Card with Edit Button */}
      <div className="surface-card rounded-3xl p-6 border border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold border border-gold/30 flex items-center justify-center font-display font-bold text-xl">
            {parentProfile?.full_name ? parentProfile.full_name.charAt(0) : <User className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-parchment">
              {parentProfile?.full_name || 'Guardian Profile'}
            </h3>
            <p className="text-mist text-xs">
              Mobile: {parentProfile?.mobile || 'N/A'} · Address: {parentProfile?.address || 'Not Provided'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="px-4 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit My Details
        </button>
      </div>

      {/* Children List */}
      <div>
        <h2 className="font-display text-2xl font-bold text-parchment mb-6">Registered Students</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child) => (
            <div
              key={child.studentRowId}
              className="surface-card rounded-[2rem] p-8 flex flex-col justify-between group relative overflow-hidden border border-hairline hover:border-gold/40 transition-all"
            >
              <div className="relative z-10 flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30 text-gold font-display text-2xl font-bold overflow-hidden flex-shrink-0">
                    {child.profilePhotoUrl ? (
                      <Image
                        src={child.profilePhotoUrl}
                        alt="Avatar"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      child.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-parchment">{child.fullName}</p>
                    <p className="text-mist font-mono text-sm tracking-widest mt-1">ID: {child.studentCode}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gold/10 text-gold border border-gold/20">
                  {child.relation}
                </span>
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3 text-mist">
                  <GraduationCap className="w-5 h-5 text-gold" />
                  <span className="font-semibold text-parchment">{child.className}</span>
                  <span>— Section {child.section}</span>
                </div>

                <Link
                  href={`/parent/progress?id=${child.studentRowId}`}
                  className="w-full py-4 rounded-xl surface-card border border-hairline flex items-center justify-center gap-3 text-mist group-hover:text-parchment group-hover:border-gold/50 transition-colors font-semibold text-sm"
                >
                  <TrendingUp className="w-4 h-4 text-gold" /> View Academic Progress
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: REQUEST GUARDIAN PROFILE UPDATE
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-lg max-h-[90vh] overflow-y-auto hide-scrollbar bg-ink text-parchment"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center bg-ink/90 sticky top-0 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-parchment">
                      Request Guardian Update
                    </h2>
                    <p className="text-xs text-mist">Submitted for Class Teacher / Admin Approval</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                    Guardian Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Primary Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Date of Birth
                    </label>
                    <DateInput name="dob" value={dob} onChange={setDob} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-gold text-ink px-8 py-3 rounded-xl font-bold text-sm hover:bg-gold/90 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Submit Request
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
