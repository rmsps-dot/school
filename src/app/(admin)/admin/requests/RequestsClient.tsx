'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import ApprovalModal from '@/components/admin/ApprovalModal'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  approveProfileChangeRequest,
  rejectProfileChangeRequest,
  type ProfileChangeRequestItem,
} from '@/actions/profile-request-actions'

/* ── Types ── */
interface Registration {
  id: string
  student_name: string
  student_dob: string | null
  student_email: string
  student_mobile: string | null
  address: string | null
  father_name: string | null
  mother_name: string | null
  parent_mobile: string | null
  parent_email: string | null
  created_at: string
  status: string
}

interface ClassOption {
  id: string
  class_name: string
  section: string
}

interface Props {
  initialRegistrations: Registration[]
  classes: ClassOption[]
  initialProfileRequests: ProfileChangeRequestItem[]
  fetchError?: string
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: {
      label: 'Pending',
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: Clock,
    },
    approved: {
      label: 'Approved',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle,
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-500/15 text-red-400 border-red-500/30',
      icon: XCircle,
    },
  }
  const { label, color, icon: Icon } = map[status] ?? map.pending
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${color}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

/* ── MAIN CLIENT ── */
export default function RequestsClient({
  initialRegistrations,
  classes,
  initialProfileRequests,
  fetchError,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'teachers' | 'parents'>('all')
  const [search, setSearch] = useState('')
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)
  const [profileReqs, setProfileReqs] = useState<ProfileChangeRequestItem[]>(initialProfileRequests)
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations)
  const [isPending, startTransition] = useTransition()
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Filter admissions
  const filteredRegistrations = registrations.filter(
    (r) =>
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.student_email.toLowerCase().includes(search.toLowerCase()) ||
      (r.parent_email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.student_mobile ?? '').includes(search)
  )

  // Filter profile requests (only pending requests appear in active review queue)
  const filteredProfileReqs = profileReqs.filter((r) => {
    if (r.status !== 'pending') return false

    const matchesSearch =
      (r.profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.profiles?.mobile ?? '').includes(search) ||
      (r.current_data?.fullName as string ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.requested_data?.fullName as string ?? '').toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (activeTab === 'all') return true
    if (activeTab === 'students') return r.role === 'student'
    if (activeTab === 'teachers') return r.role === 'teacher'
    if (activeTab === 'parents') return r.role === 'parent'
    return true
  })

  // Pending counts
  const pendingStudentsCount =
    profileReqs.filter((r) => r.role === 'student' && r.status === 'pending').length +
    registrations.filter((r) => r.status === 'pending').length
  const pendingTeachersCount = profileReqs.filter((r) => r.role === 'teacher' && r.status === 'pending').length
  const pendingParentsCount = profileReqs.filter((r) => r.role === 'parent' && r.status === 'pending').length
  const totalPendingCount =
    registrations.filter((r) => r.status === 'pending').length +
    profileReqs.filter((r) => r.status === 'pending').length

  function handleDoneReg(id: string, _type: 'approved' | 'rejected') {
    setRegistrations((prev) => prev.filter((r) => r.id !== id))
    setSelectedReg(null)
    router.refresh()
  }

  const handleApproveProfileReq = async (requestId: string) => {
    startTransition(async () => {
      const res = await approveProfileChangeRequest(requestId)
      if (res.success) {
        setProfileReqs((prev) => prev.filter((r) => r.id !== requestId))
        setActionMessage({ type: 'success', text: 'Profile change request approved & changes applied directly.' })
        router.refresh()
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to approve request.' })
      }
      setTimeout(() => setActionMessage(null), 4000)
    })
  }

  const handleRejectProfileReq = async (requestId: string) => {
    startTransition(async () => {
      const res = await rejectProfileChangeRequest(requestId, 'Rejected by Administrator.')
      if (res.success) {
        setProfileReqs((prev) => prev.filter((r) => r.id !== requestId))
        setActionMessage({ type: 'success', text: 'Profile change request rejected.' })
        router.refresh()
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to reject request.' })
      }
      setTimeout(() => setActionMessage(null), 4000)
    })
  }

  return (
    <>
      {/* Admission Approval modal */}
      <AnimatePresence>
        {selectedReg && (
          <ApprovalModal
            registration={selectedReg}
            classes={classes}
            onClose={() => setSelectedReg(null)}
            onDone={(type) => handleDoneReg(selectedReg.id, type)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div className="surface-card rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
          <div>
            <h1 className="font-display text-3xl font-bold text-parchment flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-coral" />
              Request & Approval Center
            </h1>
            <p className="text-mist mt-2 text-sm max-w-md">
              Review new admission registrations and profile modification requests across all roles.
            </p>
          </div>
          <button
            id="refresh-requests-btn"
            onClick={() => router.refresh()}
            className="flex items-center gap-2 px-6 py-3 bg-surface border border-hairline rounded-xl text-sm font-semibold text-mist hover:text-coral hover:border-coral/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Global Error */}
        {fetchError && (
          <div className="flex items-center gap-3 surface-card rounded-2xl px-6 py-4 text-sm text-red-400 border border-red-500/20 font-mono">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {fetchError}
          </div>
        )}

        {/* Action Message Banner */}
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

        {/* ── 4-Tab Bar ── */}
        <div className="surface-card rounded-2xl p-2 border border-hairline flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold font-display flex items-center justify-center gap-2 transition-all ${
              activeTab === 'all'
                ? 'bg-coral text-ink shadow-lg'
                : 'text-mist hover:text-parchment hover:bg-white/5'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            All Requests ({totalPendingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold font-display flex items-center justify-center gap-2 transition-all ${
              activeTab === 'students'
                ? 'bg-coral text-ink shadow-lg'
                : 'text-mist hover:text-parchment hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Students ({pendingStudentsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold font-display flex items-center justify-center gap-2 transition-all ${
              activeTab === 'teachers'
                ? 'bg-coral text-ink shadow-lg'
                : 'text-mist hover:text-parchment hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Teachers ({pendingTeachersCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parents')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold font-display flex items-center justify-center gap-2 transition-all ${
              activeTab === 'parents'
                ? 'bg-coral text-ink shadow-lg'
                : 'text-mist hover:text-parchment hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Parents ({pendingParentsCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mist pointer-events-none" />
          <input
            id="requests-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, email or contact number..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-ink border border-hairline text-sm text-parchment focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/50 transition-all shadow-xl"
          />
        </div>

        {/* ── SECTION 1: PROFILE EDIT REQUESTS ── */}
        {filteredProfileReqs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-mist px-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-coral" />
              Profile Modification Requests ({filteredProfileReqs.length})
            </h2>

            <div className="space-y-4">
              {filteredProfileReqs.map((req) => {
                const reqData = req.requested_data || {}
                const curData = req.current_data || {}

                return (
                  <div
                    key={req.id}
                    className="surface-card rounded-3xl p-6 border border-hairline space-y-5 hover:border-coral/40 transition-all shadow-xl"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center font-bold overflow-hidden shrink-0">
                          {req.profiles?.profile_photo_url ? (
                            <Image
                              src={req.profiles.profile_photo_url}
                              alt="Avatar"
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            req.profiles?.full_name?.charAt(0) || <UserCheck className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-parchment text-lg">
                              {req.profiles?.full_name || 'User Profile'}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-coral/15 text-coral border border-coral/30">
                              {req.role}
                            </span>
                            <StatusBadge status={req.status} />
                          </div>
                          <p className="text-mist text-xs font-mono mt-0.5">
                            {req.classes ? `Class: ${req.classes.class_name} - ${req.classes.section} · ` : ''}
                            Submitted: {formatDate(req.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Approve / Reject Actions */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleRejectProfileReq(req.id)}
                          className="px-4 py-2 rounded-xl bg-ink/70 border border-hairline text-mist hover:text-red-400 hover:border-red-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleApproveProfileReq(req.id)}
                          className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-ink text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg"
                        >
                          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Approve & Update
                        </button>
                      </div>
                    </div>

                    {/* Diff Comparison Table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      {/* Current details */}
                      <div className="bg-ink/40 rounded-2xl p-4 border border-hairline space-y-2">
                        <p className="text-mist font-bold uppercase tracking-wider text-[10px]">
                          Current Info
                        </p>
                        <div className="space-y-1 text-parchment/80">
                          <p>
                            <span className="text-mist">Name:</span> {curData.fullName || '—'}
                          </p>
                          {curData.qualification !== undefined && (
                            <p>
                              <span className="text-mist">Qualification:</span> {curData.qualification || '—'}
                            </p>
                          )}
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
                          {reqData.qualification !== undefined && (
                            <p className={curData.qualification !== reqData.qualification ? 'text-coral font-bold' : ''}>
                              <span className="text-mist">Qualification:</span> {reqData.qualification || '—'}
                            </p>
                          )}
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
          </div>
        )}

        {/* ── SECTION 2: ADMISSION REGISTRATIONS ── */}
        {(activeTab === 'all' || activeTab === 'students') && filteredRegistrations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-mist px-1 flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-coral" />
              New Student Admission Registrations ({filteredRegistrations.length})
            </h2>

            <div className="surface-card border border-hairline rounded-3xl overflow-hidden shadow-2xl">
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 px-8 py-5 border-b border-hairline bg-surface text-xs font-bold text-mist uppercase tracking-widest">
                <span>Student</span>
                <span>Parent</span>
                <span>Contact</span>
                <span>Applied</span>
                <span>Action</span>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-hairline">
                {filteredRegistrations.map((reg, i) => (
                  <div
                    key={reg.id}
                    className="ledger-row px-8 py-6 flex flex-col sm:grid sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 sm:items-center hover:bg-surface/50 transition-colors group"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {/* Student */}
                    <div className="min-w-0">
                      <p className="text-base font-bold text-parchment truncate group-hover:text-coral transition-colors">
                        {reg.student_name}
                      </p>
                      <p className="text-[10px] font-mono text-mist uppercase tracking-widest truncate mt-1">
                        {reg.student_email}
                      </p>
                    </div>

                    {/* Parent */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-parchment truncate">
                        {reg.father_name ?? '—'} / {reg.mother_name ?? '—'}
                      </p>
                      <p className="text-[10px] font-mono text-mist uppercase tracking-widest truncate mt-1">
                        {reg.parent_email ?? '—'}
                      </p>
                    </div>

                    {/* Contact */}
                    <div className="min-w-0 font-mono text-xs">
                      <p className="text-mist">{reg.student_mobile ?? '—'}</p>
                      <p className="text-mist/70 mt-1">{reg.parent_mobile ?? '—'}</p>
                    </div>

                    {/* Date */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-3">
                      <StatusBadge status={reg.status} />
                      <p className="text-[10px] font-mono text-mist uppercase tracking-widest">
                        {new Date(reg.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    {/* Action */}
                    <button
                      id={`review-btn-${reg.id}`}
                      onClick={() => setSelectedReg(reg)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-coral text-ink text-xs font-bold uppercase tracking-wider hover:bg-[#E67E6B] transition-colors whitespace-nowrap mt-2 sm:mt-0 shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state across both */}
        {filteredProfileReqs.length === 0 &&
          ((activeTab !== 'all' && activeTab !== 'students') || filteredRegistrations.length === 0) &&
          !fetchError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-2xl"
            >
              <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
                <ClipboardList className="w-10 h-10 text-mist/50" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-parchment">No pending requests</p>
                <p className="text-mist text-sm max-w-sm mt-2 mx-auto">
                  {search
                    ? 'No requests match your search criteria.'
                    : 'All applications and profile update requests for this section have been completely reviewed.'}
                </p>
              </div>
            </motion.div>
          )}
      </div>
    </>
  )
}
