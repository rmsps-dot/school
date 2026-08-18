'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Phone,
  Calendar,
  BookOpen,
  Mail,
  Edit3,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GraduationCap,
} from 'lucide-react'
import AvatarUpload from '@/components/ui/AvatarUpload'
import DateInput from '@/components/shared/DateInput'
import {
  submitProfileChangeRequest,
  type ProfileChangeRequestItem,
} from '@/actions/profile-request-actions'

export interface TeacherProfileData {
  id?: string
  teacher_id: string
  qualification?: string | null
  profiles: {
    full_name: string | null
    email: string | null
    dob: string | null
    mobile: string | null
    address: string | null
    profile_photo_url: string | null
  } | null
}

interface Props {
  teacher: TeacherProfileData
  pendingRequest: ProfileChangeRequestItem | null
}

export default function TeacherProfileClient({ teacher, pendingRequest: initialPending }: Props) {
  const router = useRouter()
  const [pendingReq, setPendingReq] = useState<ProfileChangeRequestItem | null>(initialPending)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Edit fields
  const [fullName, setFullName] = useState(teacher.profiles?.full_name || '')
  const [qualification, setQualification] = useState(teacher.qualification || '')
  const [mobile, setMobile] = useState(teacher.profiles?.mobile || '')
  const [address, setAddress] = useState(teacher.profiles?.address || '')
  const [dob, setDob] = useState(teacher.profiles?.dob ? teacher.profiles.dob.split('T')[0] : '')

  // 3D tilt
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const box = card.getBoundingClientRect()
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    setRotateX(((y - box.height / 2) / (box.height / 2)) * -8)
    setRotateY(((x - box.width / 2) / (box.width / 2)) * 8)
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

  const handleOpenModal = () => {
    setFullName(teacher.profiles?.full_name || '')
    setQualification(teacher.qualification || '')
    setMobile(teacher.profiles?.mobile || '')
    setAddress(teacher.profiles?.address || '')
    setDob(teacher.profiles?.dob ? teacher.profiles.dob.split('T')[0] : '')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const current_data = {
      fullName: teacher.profiles?.full_name || null,
      qualification: teacher.qualification || null,
      mobile: teacher.profiles?.mobile || null,
      address: teacher.profiles?.address || null,
      dob: teacher.profiles?.dob || null,
    }

    const requested_data = {
      fullName: fullName.trim(),
      qualification: qualification.trim(),
      mobile: mobile.trim() || null,
      address: address.trim() || null,
      dob: dob || null,
    }

    startTransition(async () => {
      const res = await submitProfileChangeRequest({
        role: 'teacher',
        current_data,
        requested_data,
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setPendingReq({
          id: 'temp-' + Date.now(),
          user_id: '',
          role: 'teacher',
          class_id: null,
          target_approver: 'admin',
          current_data,
          requested_data,
          status: 'pending',
          review_notes: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: new Date().toISOString(),
        })
        setIsModalOpen(false)
        setSuccessMsg('Profile update request submitted to Administrator for approval.')
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    })
  }

  const rows = [
    { icon: Mail, label: 'Email', value: teacher.profiles?.email || 'N/A' },
    { icon: GraduationCap, label: 'Qualification', value: teacher.qualification || 'N/A' },
    { icon: Calendar, label: 'D.O.B', value: formatDate(teacher.profiles?.dob) },
    { icon: Phone, label: 'Mobile Number', value: teacher.profiles?.mobile || 'N/A' },
    { icon: MapPin, label: 'Address', value: teacher.profiles?.address || 'N/A' },
  ]

  return (
    <div className="space-y-6 max-w-xl mx-auto">
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

      {/* Pending Request Status Notice */}
      {pendingReq && pendingReq.status === 'pending' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="surface-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 flex items-start gap-3.5"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs space-y-1">
            <p className="font-bold text-amber-300">Profile Update Pending Admin Approval</p>
            <p className="text-mist">
              You submitted a request to update your details. Once the administrator approves it, changes will take effect automatically.
            </p>
          </div>
        </motion.div>
      )}

      {/* 3D Digital ID Card */}
      <div className="flex flex-col items-center justify-center" style={{ perspective: '1000px' }}>
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          animate={{ rotateX, rotateY }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
          className="relative rounded-3xl overflow-hidden w-full glass-panel border border-hairline shadow-2xl"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ID Card Header */}
          <div
            className="p-5 flex items-center justify-between border-b border-hairline"
            style={{
              background: 'linear-gradient(135deg, rgba(62,92,118,0.2) 0%, rgba(62,92,118,0.08) 100%)',
              transform: 'translateZ(20px)',
            }}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-veena-blue" />
              <span className="font-display font-bold text-parchment tracking-wider text-sm">
                FACULTY ID CARD
              </span>
            </div>
            <div
              className="w-8 h-8 rounded-full overflow-hidden border border-veena-blue/30 flex-shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(62,92,118,0.1)' }}
            >
              <Image src="/icon-192.png" alt="RMSPS Logo" width={32} height={32} className="object-cover" />
            </div>
          </div>

          {/* ID Card Content */}
          <div className="p-8 flex flex-col items-center relative" style={{ transform: 'translateZ(30px)' }}>
            <div className="relative mb-6">
              <AvatarUpload
                currentPhotoUrl={teacher.profiles?.profile_photo_url}
                size="xl"
                onUploadSuccess={() => router.refresh()}
              />
              <div
                className="absolute -bottom-3 -right-3 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-veena-blue/30 text-veena-blue shadow-lg"
                style={{ background: 'var(--ink)', boxShadow: '0 0 12px rgba(62,92,118,0.2)' }}
              >
                FACULTY
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold text-parchment mb-1 text-center leading-tight">
              {teacher.profiles?.full_name?.toUpperCase() || 'UNKNOWN'}
            </h2>
            <p className="font-mono text-base tracking-widest mb-6 text-veena-blue">
              {teacher.teacher_id || 'ID-PENDING'}
            </p>

            <div className="w-full space-y-3 text-sm">
              {rows.map((row) => (
                <div key={row.label} className="flex justify-between border-b border-hairline pb-3">
                  <span className="text-mist flex items-center gap-2 text-xs uppercase tracking-wider font-mono">
                    <row.icon className="w-4 h-4 text-veena-blue" /> {row.label}
                  </span>
                  <span className="text-parchment font-medium text-right max-w-[200px] truncate text-xs">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="w-full pt-6">
              <button
                type="button"
                onClick={handleOpenModal}
                className="w-full py-3 rounded-2xl bg-veena-blue/20 hover:bg-veena-blue/30 border border-veena-blue/40 text-parchment text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Edit3 className="w-4 h-4 text-veena-blue" />
                Request Profile Update
              </button>
            </div>
          </div>

          {/* Decorative barcode footer */}
          <div
            className="px-8 pb-6 flex items-center justify-center border-t border-hairline"
            style={{ transform: 'translateZ(10px)' }}
          >
            <div className="w-3/4 h-7 flex items-end justify-between opacity-20 mt-4">
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
        </motion.div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: REQUEST PROFILE UPDATE (TEACHER -> ADMIN)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-lg overflow-hidden bg-ink text-parchment"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center bg-ink/90">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-veena-blue/20 text-veena-blue flex items-center justify-center">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-parchment">
                      Request Profile Update
                    </h2>
                    <p className="text-xs text-mist">Submitted to Admin for Approval</p>
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

              <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-veena-blue"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M.Sc. Mathematics, B.Ed"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-veena-blue"
                  />
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
                      className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-veena-blue"
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
                    className="w-full input-glass rounded-xl p-3 text-sm text-parchment focus:outline-none focus:border-veena-blue"
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
                    className="bg-veena-blue text-parchment px-8 py-3 rounded-xl font-bold text-sm hover:bg-veena-blue/90 transition-colors flex items-center gap-2 shadow-lg"
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
