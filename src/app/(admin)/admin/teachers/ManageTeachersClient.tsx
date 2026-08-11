'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, UserCircle, Trash2, Loader2, UserX, AlertCircle, BookOpen, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { addTeacher, deleteTeacher } from '@/actions/user-management-actions'
import DateInput from '@/components/shared/DateInput'

export interface TeacherRecord {
  id: string
  profile_id: string
  teacher_id: string
  qualification: string
  profiles: {
    full_name: string
    avatar_url: string | null
  }
  teacher_classes: {
    subject: string
    classes: {
      class_name: string
      section: string
    } | { class_name: string; section: string }[] | null
  }[]
}

interface ManageTeachersClientProps {
  teachers: TeacherRecord[]
}

export default function ManageTeachersClient({ teachers: initialTeachers }: ManageTeachersClientProps) {
  const [teachers, setTeachers] = useState(initialTeachers)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [joiningDate, setJoiningDate] = useState('')
  const [teacherDob, setTeacherDob] = useState('')

  const filteredTeachers = teachers.filter(t => 
    t.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.teacher_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.qualification?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await addTeacher(fd)
      if (res.error) setError(res.error)
      else window.location.reload()
    })
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this teacher and all their assignments?')) return
    
    startTransition(async () => {
      const res = await deleteTeacher(profileId)
      if (res.error) setError(res.error)
      else setTeachers(prev => prev.filter(t => t.profile_id !== profileId))
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="surface-card rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-coral" />
            Manage Teachers
          </h1>
          <p className="text-mist mt-2 max-w-md">Directly add, edit, or delete teacher profiles and assign classes in the directory.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 input-glass rounded-xl text-sm text-parchment focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/50 w-full transition-all"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto bg-coral text-ink py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap hover:bg-[#E67E6B] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl flex items-center gap-3 text-sm font-mono">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((t, index) => (
          <div 
            key={t.id} 
            className="ledger-row surface-card border-hairline overflow-hidden relative group transition-transform hover:-translate-y-1 hover:border-coral/40"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={() => handleDelete(t.profile_id)}
                className="p-2 text-mist hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-md bg-ink/50 border border-hairline"
                title="Delete Teacher"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center text-center border-b border-hairline bg-surface">
              <Link href={`/admin/teachers/${t.profile_id}`} className="flex flex-col items-center group/link">
              {t.profiles?.avatar_url ? (
                <Image src={t.profiles.avatar_url} alt="Avatar" width={80} height={80} className="w-20 h-20 rounded-full object-cover border-4 border-ink shadow-xl mb-4 group-hover/link:ring-2 ring-coral transition-all" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-ink border-4 border-ink flex items-center justify-center shadow-xl mb-4 text-mist group-hover/link:ring-2 ring-coral group-hover/link:text-coral transition-all">
                  <UserCircle className="w-10 h-10" />
                </div>
              )}
              <h3 className="font-display font-bold text-xl text-parchment group-hover/link:text-coral transition-colors">{t.profiles?.full_name}</h3>
              </Link>
              <p className="text-sm text-coral font-medium mt-1 font-mono">{t.teacher_id}</p>
              <p className="text-xs text-mist mt-2 line-clamp-1 border border-hairline px-3 py-1 rounded-full">{t.qualification}</p>
            </div>
            
            <div className="p-5 bg-ink">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-mist" />
                <h4 className="text-xs font-bold text-parchment uppercase tracking-widest">Assigned Classes</h4>
              </div>
              {t.teacher_classes?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {t.teacher_classes.map((tc: any, i: number) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 bg-surface border border-hairline rounded-md text-mist group-hover:border-coral/30 transition-colors">
                      {tc.classes?.class_name} • {tc.subject}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-mist/60 italic font-mono">No classes assigned yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="surface-card rounded-[2rem] p-16 text-center border border-hairline">
          <UserX className="w-16 h-16 text-mist mx-auto mb-6 opacity-50" />
          <h2 className="font-display text-2xl font-bold text-parchment">No Teachers Found</h2>
          <p className="text-mist mt-2 max-w-sm mx-auto">Try adjusting your search criteria or add a new teacher to the directory.</p>
        </div>
      )}

      {/* ADD TEACHER MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center sticky top-0 bg-ink/90 backdrop-blur-md z-10">
                <h2 className="font-display text-2xl font-bold text-parchment">Add New Teacher</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-mist hover:text-coral transition-colors">✕</button>
              </div>
              <form onSubmit={handleAddTeacher} className="p-6 space-y-8">
                
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl flex items-center gap-3 text-sm font-mono">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-coral uppercase tracking-widest border-b border-hairline pb-2">Account Credentials</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Email Address</label>
                      <input required type="email" name="email" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Password</label>
                      <input required type="password" name="password" minLength={6} className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-coral uppercase tracking-widest border-b border-hairline pb-2">Teacher Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Full Name</label>
                      <input required type="text" name="fullName" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2 hidden">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Teacher ID</label>
                      <input type="text" name="teacherId" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Qualification</label>
                      <input type="text" name="qualification" placeholder="e.g. M.Sc, B.Ed" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <DateInput label="Joining Date" value={joiningDate} onChange={setJoiningDate} />
                      <input type="hidden" name="joiningDate" value={joiningDate} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-coral uppercase tracking-widest border-b border-hairline pb-2">Personal Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <DateInput label="Date of Birth" value={teacherDob} onChange={setTeacherDob} />
                      <input type="hidden" name="dob" value={teacherDob} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Mobile Number</label>
                      <input type="tel" name="mobile" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Address</label>
                      <input type="text" name="address" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-4 border-t border-hairline">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm bg-ink border border-hairline text-parchment hover:border-mist transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="flex-1 bg-coral text-ink py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#E67E6B] transition-colors">
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Teacher'}
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
