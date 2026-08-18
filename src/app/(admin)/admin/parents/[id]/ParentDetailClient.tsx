'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  UserCircle,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  Edit3,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Search,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import AvatarUpload from '@/components/ui/AvatarUpload'
import ParentEditModal from '@/components/admin/ParentEditModal'
import { linkStudentToParent, unlinkStudentFromParent } from '@/actions/admin-management-actions'

export interface ParentDetailData {
  id: string
  profile_id: string
  profiles: {
    full_name: string | null
    email: string | null
    mobile: string | null
    address: string | null
    profile_photo_url: string | null
    dob: string | null
  } | null
  created_at?: string
  parent_students: {
    students: {
      id: string
      profile_id: string
      student_id: string
      profiles: {
        full_name: string | null
        profile_photo_url: string | null
      } | null
      classes?: {
        class_name: string
        section: string
      } | null
    } | null
  }[] | null
}

interface AvailableStudentItem {
  id: string
  student_id: string
  profiles: { full_name: string | null; mobile: string | null } | { full_name: string | null; mobile: string | null }[] | null
  classes: { class_name: string; section: string } | { class_name: string; section: string }[] | null
}

interface Props {
  parent: ParentDetailData
  availableStudents: AvailableStudentItem[]
}

export default function ParentDetailClient({ parent, availableStudents }: Props) {
  const router = useRouter()
  const profile = parent.profiles || ({} as Partial<NonNullable<ParentDetailData['profiles']>>)
  const [children, setChildren] = useState(parent.parent_students || [])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const formatDate = (d?: string) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Linked student IDs to filter out in the link modal
  const linkedStudentIds = new Set(
    children.map((c) => c.students?.id).filter(Boolean) as string[]
  )

  const unlinkedAvailableStudents = availableStudents.filter((s) => !linkedStudentIds.has(s.id))

  const filteredSearchStudents = unlinkedAvailableStudents.filter((s) => {
    const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    return (
      s.student_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
      p?.full_name?.toLowerCase().includes(studentSearch.toLowerCase())
    )
  })

  // ── Action: Link Student ──
  const handleLinkStudent = (studentId: string) => {
    setErrorMsg('')
    startTransition(async () => {
      const res = await linkStudentToParent(parent.id, studentId)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        const studentObj = availableStudents.find((s) => s.id === studentId)
        if (studentObj) {
          const sp = Array.isArray(studentObj.profiles) ? studentObj.profiles[0] : studentObj.profiles
          const sc = Array.isArray(studentObj.classes) ? studentObj.classes[0] : studentObj.classes
          setChildren([
            ...children,
            {
              students: {
                id: studentObj.id,
                profile_id: '',
                student_id: studentObj.student_id,
                profiles: {
                  full_name: sp?.full_name || null,
                  profile_photo_url: null,
                },
                classes: sc ? { class_name: sc.class_name, section: sc.section } : null,
              },
            },
          ])
        }
        setIsLinkModalOpen(false)
        setSuccessMsg('Student linked to parent successfully.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  // ── Action: Unlink Student ──
  const handleUnlinkStudent = (studentId: string) => {
    if (!confirm('Are you sure you want to unlink this student from this parent profile?')) return
    setErrorMsg('')

    startTransition(async () => {
      const res = await unlinkStudentFromParent(parent.id, studentId)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setChildren((prev) => prev.filter((c) => c.students?.id !== studentId))
        setSuccessMsg('Student unlinked from parent.')
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/parents"
          className="p-2.5 rounded-xl surface-card border border-hairline hover:border-mist/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-parchment" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-parchment leading-tight">Parent Profile</h1>
          <p className="text-mist text-sm">Detailed Guardian & Student Overview</p>
        </div>
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
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-hairline relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6">
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }}
        />

        <div className="shrink-0 relative z-10">
          <AvatarUpload
            currentPhotoUrl={profile.profile_photo_url}
            userId={parent.profile_id}
            size="lg"
            onUploadSuccess={() => router.refresh()}
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-3 relative z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-parchment mb-2">
                {profile.full_name}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span
                  className="px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider text-gold border border-gold/30"
                  style={{ background: 'rgba(212,175,106,0.08)' }}
                >
                  Parent / Guardian
                </span>
                <span className="text-mist text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined: {formatDate(parent.created_at)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-hairline hover:border-coral/40 text-mist hover:text-coral transition-all flex items-center justify-center gap-2 text-xs font-bold bg-white/5 mx-auto md:mx-0 shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start text-xs pt-2">
            <div className="flex items-center gap-2 text-parchment surface-card px-3 py-1.5 rounded-lg border border-hairline">
              <Phone className="w-4 h-4 text-coral" />
              <span>{profile.mobile || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-parchment surface-card px-3 py-1.5 rounded-lg border border-hairline">
              <MapPin className="w-4 h-4 text-coral" />
              <span className="truncate max-w-[260px]">{profile.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Linked Students Section ── */}
      <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline space-y-6">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            <h3 className="font-display text-xl font-bold text-parchment">
              Linked Children / Students ({children.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gold text-ink text-xs font-bold hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Link Child
          </button>
        </div>

        {children.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {children.map((ps, i: number) => {
              const student = ps.students
              if (!student) return null
              const sprof = (Array.isArray(student.profiles) ? student.profiles[0] : student.profiles) as {
                full_name?: string | null
                profile_photo_url?: string | null
              } | null
              const cls = (Array.isArray(student.classes) ? student.classes[0] : student.classes) as {
                class_name?: string
                section?: string
              } | null

              return (
                <motion.div
                  key={student.id || i}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="surface-card rounded-2xl border border-hairline p-4 flex items-center justify-between gap-4 hover:border-coral/30 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="shrink-0">
                      {sprof?.profile_photo_url ? (
                        <div className="w-12 h-12 relative rounded-full overflow-hidden border-2 border-hairline flex-shrink-0">
                          <Image
                            src={sprof.profile_photo_url}
                            alt="Student"
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center border border-hairline"
                          style={{ background: 'rgba(241,145,125,0.06)' }}
                        >
                          <GraduationCap className="w-6 h-6 text-coral/40" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-parchment truncate">{sprof?.full_name || 'Student'}</h4>
                      <p className="text-xs font-mono text-coral">{student.student_id}</p>
                      <p className="text-[11px] text-mist font-mono mt-0.5">
                        Class: {cls?.class_name || '—'} {cls?.section ? `(${cls.section})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-hairline text-parchment hover:border-coral transition-colors"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleUnlinkStudent(student.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                      title="Unlink Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-mist italic surface-card rounded-2xl border border-hairline">
            No students are currently linked to this parent. Click &ldquo;Link Child&rdquo; above.
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT PARENT DETAILS
      ───────────────────────────────────────────────────────────── */}
      {profile && (
        <ParentEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          parent={{
            id: parent.id,
            full_name: profile.full_name || null,
            mobile: profile.mobile || null,
            address: profile.address || null,
            dob: profile.dob || null,
          }}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: LINK STUDENT TO PARENT
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-lg max-h-[90vh] overflow-y-auto hide-scrollbar bg-ink text-parchment"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center sticky top-0 bg-ink/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-parchment">Link Child / Student</h2>
                    <p className="text-xs text-mist">{profile.full_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="text-mist hover:text-coral transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
                  <input
                    type="text"
                    placeholder="Search by student name or roll ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 input-glass rounded-xl text-xs text-parchment focus:outline-none focus:border-coral"
                  />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredSearchStudents.length === 0 ? (
                    <p className="text-xs text-mist text-center py-6 italic font-mono">
                      No matching unlinked students found.
                    </p>
                  ) : (
                    filteredSearchStudents.map((st) => {
                      const sp = Array.isArray(st.profiles) ? st.profiles[0] : st.profiles
                      const sc = Array.isArray(st.classes) ? st.classes[0] : st.classes
                      return (
                        <div
                          key={st.id}
                          className="p-3 rounded-2xl bg-surface border border-hairline flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-parchment">{sp?.full_name || 'Student'}</p>
                            <p className="text-xs font-mono text-coral">{st.student_id}</p>
                            <p className="text-[11px] text-mist font-mono">
                              {sc ? `${sc.class_name} (${sc.section})` : 'Class N/A'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLinkStudent(st.id)}
                            disabled={isPending}
                            className="px-4 py-2 rounded-xl bg-gold text-ink text-xs font-bold hover:bg-gold/90 transition-colors flex items-center gap-1 shadow-md"
                          >
                            {isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            Link
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="pt-3 flex justify-end border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-hairline text-mist hover:text-parchment font-semibold text-xs transition-colors"
                  >
                    Close
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
