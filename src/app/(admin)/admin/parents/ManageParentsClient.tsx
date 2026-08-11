'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Trash2, Loader2, UserX, AlertCircle, Link as LinkIcon, Mail, Plus, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { deleteParent, sendPasswordResetLink, linkStudentToParent } from '@/actions/user-management-actions'

export interface ParentRecord {
  id: string
  parent_id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
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
            <div className="p-6 flex justify-between items-start border-b border-hairline bg-white/5">
              <Link href={`/admin/parents/${p.id}`} className="flex items-center gap-4 group/link">
                {p.avatar_url ? (
                  <Image src={p.avatar_url} alt="Avatar" width={56} height={56} className="w-14 h-14 rounded-full object-cover border border-hairline group-hover/link:ring-2 ring-coral/50 transition-all flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover/link:ring-2 ring-coral/50 transition-all">
                    <Users className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover/link:text-coral transition-colors">{p.full_name}</h3>
                  <p className="text-xs text-mist">Parent Profile</p>
                </div>
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePasswordReset(p.id)}
                  className="p-2 text-coral hover:bg-coral/10 rounded-lg transition-colors"
                  title="Send Password Reset"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-mist hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete Parent"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                      <div className="w-8 h-8 rounded-full surface-card flex items-center justify-center text-mist">
                        <UserCircle className="w-4 h-4" />
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
    </div>
  )
}
