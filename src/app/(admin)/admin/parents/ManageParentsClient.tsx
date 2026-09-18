'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Trash2, Loader2, UserX, AlertCircle, Link as LinkIcon, Mail, Plus, UserCircle, Pencil, Key, Copy, Check, RefreshCw, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { deleteParent, sendPasswordResetLink, linkStudentToParent, sendParentDirectCredentials } from '@/actions/user-management-actions'

export interface ParentRecord {
  id: string
  parent_id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  mobile: string | null
  address: string | null
  dob: string | null
  parent_students: {
    students: {
      profile_id: string
      student_id: string
      profiles: {
        full_name: string | null
      } | null
    } | null
  }[] | null
}

import type { StudentRecord } from '../students/ManageStudentsClient'
import ParentEditModal from '@/components/admin/ParentEditModal'

interface ManageParentsClientProps {
  parents: ParentRecord[]
  students: StudentRecord[]
}

export default function ManageParentsClient({ parents: initialParents, students }: ManageParentsClientProps) {
  const [parents, setParents] = useState(initialParents)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  
  // Link Student State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')

  // Edit Parent State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedParentForEdit, setSelectedParentForEdit] = useState<ParentRecord | null>(null)

  // Direct Credentials Modal State
  const [credentialsModal, setCredentialsModal] = useState<{
    parent: ParentRecord
    generatedPassword?: string
    emailSent?: boolean
    emailError?: string
    isComplete?: boolean
  } | null>(null)
  const [customPasswordInput, setCustomPasswordInput] = useState('')
  const [targetEmailInput, setTargetEmailInput] = useState('')
  const [showPasswordText, setShowPasswordText] = useState(false)
  const [credError, setCredError] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // Image Error State
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let rand = ''
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `RMSPS@${rand}!`
  }

  const openCredentialsModal = (p: ParentRecord) => {
    const defaultPw = generateRandomPassword()
    setCustomPasswordInput(defaultPw)
    setTargetEmailInput(p.email || '')
    setCredError('')
    setIsCopied(false)
    setShowPasswordText(false)
    setCredentialsModal({ parent: p, isComplete: false })
  }

  const handleSendDirectCredentials = async () => {
    if (!credentialsModal?.parent) return
    const pw = customPasswordInput.trim()
    const email = targetEmailInput.trim()
    if (!email) {
      setCredError('Please enter a valid email address for the parent.')
      return
    }
    if (!pw || pw.length < 6) {
      setCredError('Password must be at least 6 characters long.')
      return
    }
    setCredError('')
    startTransition(async () => {
      const res = await sendParentDirectCredentials(credentialsModal.parent.id, pw, email)
      if (res.error) {
        setCredError(res.error)
      } else {
        setCredentialsModal((prev) =>
          prev
            ? {
                ...prev,
                parent: { ...prev.parent, email: res.email || email },
                generatedPassword: res.password,
                emailSent: res.emailSent,
                emailError: res.emailError,
                isComplete: true,
              }
            : null
        )
      }
    })
  }

  const handleCopyCredentials = () => {
    if (!credentialsModal?.parent) return
    const email = credentialsModal.parent.email || targetEmailInput || ''
    const pw = credentialsModal.generatedPassword || customPasswordInput
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rmsps.vercel.app'
    const text = `Residential Maa Saraswati Public School (RMSPS)\nParent Portal Login Credentials:\n\nEmail: ${email}\nPassword: ${pw}\nLogin URL: ${siteUrl}/login?role=parent\n\nPlease log in and update your password after first login.`

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2500)
    })
  }

  const filteredParents = parents.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this parent account? (This does not delete their linked students)')) return
    
    startTransition(async () => {
      const res = await deleteParent(profileId)
      if (res.error) setError(res.error)
      else setParents(prev => prev.filter(p => p.id !== profileId))
    })
  }

  const handlePasswordReset = async (profileId: string) => {
    startTransition(async () => {
      const res = await sendPasswordResetLink(profileId)
      if (res.error) alert(res.error)
      else alert(`Password reset link sent to ${res.email}`)
    })
  }

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParentId || !selectedStudentId) return
    setError('')

    startTransition(async () => {
      const res = await linkStudentToParent(selectedParentId, selectedStudentId)
      if (res.error) setError(res.error)
      else window.location.reload()
    })
  }

  const openLinkModal = (parentId: string) => {
    setSelectedParentId(parentId)
    setIsLinkModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 border border-hairline flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Manage Parents
          </h1>
          <p className="text-mist text-sm mt-1">Manage parent profiles and link multiple students to a parent account.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              placeholder="Search parents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-ink/50 border border-hairline rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-coral/50 w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredParents.map(p => (
          <div key={p.id} className="glass rounded-2xl border border-hairline overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-hairline bg-white/5">
              <Link href={`/admin/parents/${p.id}`} className="flex items-center gap-3 sm:gap-4 group/link min-w-0 flex-1">
                {p.avatar_url && !imageErrors[p.id] ? (
                  <Image 
                    src={p.avatar_url} 
                    alt="Avatar" 
                    width={56} 
                    height={56} 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-hairline group-hover/link:ring-2 ring-coral/50 transition-all shrink-0" 
                    onError={() => setImageErrors(prev => ({ ...prev, [p.id]: true }))}
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover/link:ring-2 ring-coral/50 transition-all shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover/link:text-coral transition-colors truncate">{p.full_name}</h3>
                  <p className="text-xs text-mist">Parent Profile</p>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                <button
                  type="button"
                  onClick={() => openCredentialsModal(p)}
                  className="h-9 px-3 text-gold hover:bg-gold/15 rounded-xl transition-colors border border-gold/30 hover:border-gold/50 flex items-center gap-1.5 text-xs font-semibold shrink-0 bg-gold/5"
                  title="Direct Login Credentials (Set & Send)"
                >
                  <Key className="w-4 h-4 shrink-0" />
                  <span>Credentials</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePasswordReset(p.id)}
                  className="w-9 h-9 flex items-center justify-center text-coral hover:bg-coral/15 rounded-xl transition-colors border border-coral/25 hover:border-coral/40 shrink-0 bg-coral/5"
                  title="Send Password Reset Link via Email"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParentForEdit(p)
                    setIsEditModalOpen(true)
                  }}
                  className="w-9 h-9 flex items-center justify-center text-mist hover:text-white hover:bg-white/10 rounded-xl transition-colors border border-white/10 hover:border-white/20 shrink-0 bg-white/5"
                  title="Edit Parent"
                >
                  <Pencil className="w-4 h-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="w-9 h-9 flex items-center justify-center text-mist hover:text-red-400 hover:bg-red-500/15 rounded-xl transition-colors border border-white/10 hover:border-red-500/30 shrink-0 bg-white/5"
                  title="Delete Parent"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Trash2 className="w-4 h-4 shrink-0 text-red-400/80 hover:text-red-400" />}
                </button>
              </div>
            </div>
            
            <div className="p-6 bg-ink/30 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-parchment">Linked Students</h4>
                <button
                  onClick={() => openLinkModal(p.parent_id)}
                  className="text-xs flex items-center gap-1 text-coral hover:text-coral/80 transition-colors bg-coral/10 px-2 py-1 rounded"
                >
                  <Plus className="w-3 h-3" /> Link Student
                </button>
              </div>
              
              {(p.parent_students?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {p.parent_students!.map((ps: NonNullable<ParentRecord["parent_students"]>[0], i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-2.5 rounded-lg border border-hairline">
                      <div className="w-8 h-8 rounded-full surface-card flex items-center justify-center text-mist flex-shrink-0 overflow-hidden border border-hairline">
                        {(() => {
                          const photoUrl = (ps.students?.profiles as { profile_photo_url?: string | null } | null)?.profile_photo_url
                          return photoUrl ? (
                            <Image src={photoUrl} alt="Student Avatar" width={32} height={32} className="w-full h-full object-cover" />
                          ) : (
                            <UserCircle className="w-4 h-4" />
                          )
                        })()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-none">{ps.students?.profiles?.full_name}</p>
                        <p className="text-[10px] text-mist mt-1 uppercase">{ps.students?.student_id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-hairline rounded-xl">
                  <p className="text-xs text-mist">No students mapped to this parent yet.</p>
                </div>
              )}

              {/* Bottom Profile Link */}
              <div className="mt-4 pt-3 border-t border-hairline">
                <Link
                  href={`/admin/parents/${p.id}`}
                  className="w-full py-2.5 rounded-xl bg-surface border border-hairline text-center text-xs font-bold text-mist hover:text-parchment hover:border-coral/50 transition-colors block"
                >
                  View Full Profile & Log →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredParents.length === 0 && (
        <div className="glass rounded-2xl p-16 text-center border border-hairline">
          <UserX className="w-20 h-20 text-mist mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">No Parents Found</h2>
          <p className="text-mist mt-2">Parents are automatically created when admitting students.</p>
        </div>
      )}

      {/* LINK STUDENT MODAL */}
      <AnimatePresence>
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-strong rounded-2xl border border-hairline w-full max-w-md"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-coral" /> Link Student
                </h2>
                <button onClick={() => setIsLinkModalOpen(false)} className="text-mist hover:text-white">✕</button>
              </div>
              <form onSubmit={handleLinkStudent} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-parchment">Select Student to Link</label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full bg-ink/50 border border-hairline rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-coral/50"
                  >
                    <option value="">-- Choose a Student --</option>
                    {students.map(s => (
                      <option key={s.profile_id} value={s.profile_id}>
                        {s.profiles?.full_name} ({s.student_id})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsLinkModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm surface-card text-white hover:bg-surface transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="flex-1 btn-primary py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Link to Parent'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIRECT CREDENTIALS MODAL */}
      <AnimatePresence>
        {credentialsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-strong rounded-2xl border border-hairline w-full max-w-md overflow-hidden shadow-2xl bg-[#0E0E14]"
            >
              {/* Header */}
              <div className="p-6 border-b border-hairline flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Parent Login Credentials</h2>
                    <p className="text-xs text-mist">Set password &amp; send directly to Gmail</p>
                  </div>
                </div>
                <button
                  onClick={() => setCredentialsModal(null)}
                  className="text-mist hover:text-white p-1 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Parent Info summary & Email address */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-ink/60 border border-hairline flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-mist">Parent Account</p>
                      <p className="text-sm font-semibold text-parchment">{credentialsModal.parent.full_name || 'Parent'}</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-medium">
                      Direct Set
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-mist uppercase tracking-wider">
                      Parent Email Address <span className="text-coral">*</span>
                    </label>
                    <input
                      type="email"
                      value={targetEmailInput}
                      onChange={(e) => setTargetEmailInput(e.target.value)}
                      placeholder="parent@gmail.com"
                      className="w-full bg-ink/60 border border-hairline rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                    <p className="text-[11px] text-mist/70">
                      Login credentials will be dispatched to this email address.
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {credError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{credError}</p>
                  </div>
                )}

                {!credentialsModal.isComplete ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-mist uppercase tracking-wider">
                          Temporary Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setCustomPasswordInput(generateRandomPassword())}
                          className="text-[11px] text-gold hover:underline flex items-center gap-1 font-medium"
                        >
                          <RefreshCw className="w-3 h-3" /> Auto-Generate New
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={showPasswordText ? 'text' : 'password'}
                          value={customPasswordInput}
                          onChange={(e) => setCustomPasswordInput(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-ink/60 border border-hairline rounded-xl px-4 py-2.5 pr-20 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordText(!showPasswordText)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mist hover:text-white"
                        >
                          {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-mist/70">
                        This password will be updated in the parent&apos;s account and emailed to them.
                      </p>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCredentialsModal(null)}
                        className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-xs surface-card text-white hover:bg-surface transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isPending || !targetEmailInput.trim()}
                        onClick={handleSendDirectCredentials}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-gold hover:bg-gold/90 text-ink transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/15 disabled:opacity-50"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Setting &amp; Sending...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            <span>Set &amp; Send to Gmail</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Success Alert */}
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <ShieldCheck className="w-5 h-5" /> Password Set Successfully!
                      </div>
                      <p className="text-xs text-emerald-300/90 leading-relaxed">
                        {credentialsModal.emailSent
                          ? `Official credentials email has been dispatched to ${credentialsModal.parent.email}.`
                          : `Password was updated in database, but email delivery note: ${credentialsModal.emailError || 'Check SMTP configuration'}`}
                      </p>
                    </div>

                    {/* Credentials Preview Box */}
                    <div className="p-4 rounded-xl bg-black/40 border border-hairline font-mono text-xs space-y-2">
                      <div className="flex justify-between items-center text-mist">
                        <span>Email:</span>
                        <span className="text-white font-bold">{credentialsModal.parent.email}</span>
                      </div>
                      <div className="flex justify-between items-center text-mist">
                        <span>Password:</span>
                        <span className="text-gold font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                          {credentialsModal.generatedPassword || customPasswordInput}
                        </span>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="w-full py-3 rounded-xl font-bold text-xs border border-white/20 hover:border-gold text-white hover:text-gold bg-white/[0.04] hover:bg-gold/10 transition-all flex items-center justify-center gap-2"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Credentials (for WhatsApp / SMS)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCredentialsModal(null)}
                      className="w-full py-2.5 rounded-xl font-semibold text-xs surface-card text-white hover:bg-surface transition-colors"
                    >
                      Done / Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Parent Modal */}
      {selectedParentForEdit && (
        <ParentEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          parent={selectedParentForEdit}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
}
