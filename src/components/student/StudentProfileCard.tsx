'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit3,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import DateInput from '@/components/shared/DateInput'
import {
  submitProfileChangeRequest,
  type ProfileChangeRequestItem,
} from '@/actions/profile-request-actions'
import type { StudentProfile } from '@/actions/portal-actions'

interface Props {
  profile: StudentProfile
  initialPendingRequest: ProfileChangeRequestItem | null
}

export default function StudentProfileCard({ profile, initialPendingRequest }: Props) {
  const [pendingReq, setPendingReq] = useState<ProfileChangeRequestItem | null>(initialPendingRequest)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form State
  const [fullName, setFullName] = useState(profile.fullName || '')
  const [fatherName, setFatherName] = useState(profile.fatherName || '')
  const [motherName, setMotherName] = useState(profile.motherName || '')
  const [mobile, setMobile] = useState(profile.mobile || '')
  const [address, setAddress] = useState(profile.address || '')
  const [dob, setDob] = useState(profile.dob ? profile.dob.split('T')[0] : '')

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleOpenModal = () => {
    setFullName(profile.fullName || '')
    setFatherName(profile.fatherName || '')
    setMotherName(profile.motherName || '')
    setMobile(profile.mobile || '')
    setAddress(profile.address || '')
    setDob(profile.dob ? profile.dob.split('T')[0] : '')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const current_data = {
      fullName: profile.fullName || null,
      fatherName: profile.fatherName || null,
      motherName: profile.motherName || null,
      mobile: profile.mobile || null,
      address: profile.address || null,
      dob: profile.dob || null,
    }

    const requested_data = {
      fullName: fullName.trim(),
      fatherName: fatherName.trim() || null,
      motherName: motherName.trim() || null,
      mobile: mobile.trim() || null,
      address: address.trim() || null,
      dob: dob || null,
    }

    startTransition(async () => {
      const res = await submitProfileChangeRequest({
        role: 'student',
        class_id: profile.classId,
        current_data,
        requested_data,
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setPendingReq({
          id: 'temp-' + Date.now(),
          user_id: '',
          role: 'student',
          class_id: profile.classId,
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
        setSuccessMsg('Profile update request sent to your Class Teacher for approval.')
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    })
  }

  return (
    <div className="space-y-4">
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
            <p className="font-bold text-amber-300">Update Request Pending</p>
            <p className="text-mist text-[11px]">
              Your profile update request has been submitted to your Class Teacher.
            </p>
          </div>
        </motion.div>
      )}

      {/* Digital ID Card */}
      <div className="relative group overflow-hidden rounded-[2rem] glass-panel p-6 border border-hairline hover:border-[#81B29A]/40 transition-all duration-500 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#81B29A]/20 flex items-center justify-center border border-[#81B29A]/30 text-[#81B29A] font-display text-2xl font-bold overflow-hidden flex-shrink-0">
            {profile.profilePhotoUrl ? (
              <Image
                src={profile.profilePhotoUrl}
                alt="Avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.fullName.charAt(0)
            )}
          </div>
          <div>
            <p className="font-display text-xl font-bold text-parchment">{profile.fullName}</p>
            <p className="text-[#81B29A] font-mono text-sm tracking-widest mt-1">STUDENT ID</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between items-end border-b border-hairline pb-2">
            <span className="text-mist uppercase tracking-widest font-mono text-[10px]">Enrollment</span>
            <span className="text-parchment font-mono">{fmtDate(profile.admissionDate)}</span>
          </div>
          <div className="flex justify-between items-end border-b border-hairline pb-2">
            <span className="text-mist uppercase tracking-widest font-mono text-[10px]">D.O.B</span>
            <span className="text-parchment font-mono">{fmtDate(profile.dob)}</span>
          </div>
          {profile.fatherName && (
            <div className="flex justify-between items-end border-b border-hairline pb-2">
              <span className="text-mist uppercase tracking-widest font-mono text-[10px]">Father</span>
              <span className="text-parchment font-medium">{profile.fatherName}</span>
            </div>
          )}
          {profile.motherName && (
            <div className="flex justify-between items-end border-b border-hairline pb-2">
              <span className="text-mist uppercase tracking-widest font-mono text-[10px]">Mother</span>
              <span className="text-parchment font-medium">{profile.motherName}</span>
            </div>
          )}
          {profile.mobile && (
            <div className="flex justify-between items-end border-b border-hairline pb-2">
              <span className="text-mist uppercase tracking-widest font-mono text-[10px]">Contact</span>
              <span className="text-parchment font-mono">{profile.mobile}</span>
            </div>
          )}
          {profile.address && (
            <div className="flex justify-between items-end border-b border-hairline pb-2">
              <span className="text-mist uppercase tracking-widest font-mono text-[10px]">Address</span>
              <span className="text-parchment font-medium truncate max-w-[170px]">{profile.address}</span>
            </div>
          )}
        </div>

        <div className="pt-5 mt-2 border-t border-hairline">
          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full py-2.5 rounded-xl bg-[#81B29A]/15 hover:bg-[#81B29A]/25 border border-[#81B29A]/30 text-parchment text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#81B29A]" />
            Request Profile Update
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: REQUEST PROFILE UPDATE (STUDENT -> CLASS TEACHER)
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
                  <div className="w-10 h-10 rounded-xl bg-[#81B29A]/20 text-[#81B29A] flex items-center justify-center">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-parchment">
                      Request Profile Update
                    </h2>
                    <p className="text-xs text-mist">Submitted to Class Teacher for Approval</p>
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
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-[#81B29A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Father&apos;s Name
                    </label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-[#81B29A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Mother&apos;s Name
                    </label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-[#81B29A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-[#81B29A]"
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
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-[#81B29A]"
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
                    className="bg-[#81B29A] text-ink px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#81B29A]/90 transition-colors flex items-center gap-2 shadow-lg"
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
