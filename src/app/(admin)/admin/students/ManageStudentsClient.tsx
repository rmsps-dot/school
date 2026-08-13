'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, UserCircle, Trash2, Loader2, UserX, AlertCircle, Edit, GraduationCap, CheckCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { addStudent, deleteStudent, updateStudent } from '@/actions/user-management-actions'
import type { SchoolClass } from '@/actions/class-actions'
import DateInput from '@/components/shared/DateInput'

export interface StudentRecord {
  id: string
  student_id: string
  profile_id: string
  father_name: string | null
  profiles: {
    full_name: string | null
    profile_photo_url: string | null
    dob: string | null
    mobile: string | null
    address: string | null
  } | null
  classes: {
    class_name: string
    section: string
  } | null
}

interface ManageStudentsClientProps {
  students: StudentRecord[]
  classes: SchoolClass[]
}

export default function ManageStudentsClient({ students: initialStudents, classes }: ManageStudentsClientProps) {
  const router = useRouter()
  const [students, setStudents] = useState(initialStudents)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [createParent, setCreateParent] = useState(true)
  const [addDob, setAddDob] = useState('')
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [editDob, setEditDob] = useState('')
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId && initialStudents.length > 0) {
      const studentToEdit = initialStudents.find(s => s.id === editId)
      if (studentToEdit) {
        setEditingStudent(studentToEdit)
        setEditDob(studentToEdit.profiles?.dob || '')
        setIsEditModalOpen(true)
        // Clear the query parameter immediately so it doesn't trigger again on revalidation/refresh
        router.replace('/admin/students', { scroll: false })
      }
    }
  }, [searchParams, initialStudents, router])

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
    setAddError('')
    setAddSuccess('')
    setAddDob('')
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditError('')
    setEditSuccess('')
    setEditingStudent(null)
    setEditDob('')
    if (searchParams.get('edit')) {
      router.push('/admin/students')
    }
  }

  const filteredStudents = students.filter(s => 
    s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.classes?.class_name?.toLowerCase().includes(search.toLowerCase())
  )

  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const className = `${student.classes?.class_name} ${student.classes?.section && student.classes?.section !== '-' ? `(Sec ${student.classes.section})` : ''}`
    if (!acc[className]) acc[className] = []
    acc[className].push(student)
    return acc
  }, {} as Record<string, any[]>)

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAddError('')
    setAddSuccess('')
    const fd = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await addStudent(fd)
      if (res.error) {
        setAddError(res.error)
      } else {
        setAddSuccess('Student added successfully! Reloading page...')
        setTimeout(() => {
          handleCloseAddModal()
          window.location.href = '/admin/students'
        }, 1500)
      }
    })
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this student and all their records?')) return
    setError('')
    
    startTransition(async () => {
      const res = await deleteStudent(profileId)
      if (res.error) setError(res.error)
      else setStudents(prev => prev.filter(s => s.profile_id !== profileId))
    })
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')
    const fd = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await updateStudent(fd)
      if (res.error) {
        setEditError(res.error)
      } else {
        setEditSuccess('Student updated successfully! Reloading page...')
        setTimeout(() => {
          handleCloseEditModal()
          window.location.href = '/admin/students'
        }, 1500)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="surface-card rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-coral" />
            Manage Students
          </h1>
          <p className="text-mist mt-2 max-w-md">Directly add, edit, or remove student profiles across all classes in the directory.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 input-glass rounded-xl text-sm text-parchment focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/50 w-full transition-all"
            />
          </div>
          <button
            onClick={() => {
              setAddError('')
              setAddSuccess('')
              setIsAddModalOpen(true)
            }}
            className="w-full sm:w-auto bg-coral text-ink py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap hover:bg-[#E67E6B] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Student
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

      {/* ── Student Lists Grouped by Class ── */}
      <div className="space-y-12">
        {Object.entries(groupedStudents).map(([className, classStudents]: [string, StudentRecord[]]) => (
          <div key={className} className="space-y-4">
            <div className="flex items-end justify-between border-b border-hairline pb-2">
              <h2 className="font-display text-2xl font-bold text-parchment">{className}</h2>
              <p className="text-sm font-mono text-coral tracking-widest uppercase">{classStudents.length} Enrolled</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classStudents.map((s: StudentRecord, index: number) => (
                <div 
                  key={s.id} 
                  className="ledger-row surface-card p-4 flex items-center gap-4 transition-all relative group hover:border-coral/40 cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => router.push(`/admin/students/${s.id}`)}
                >
                  {s.profiles?.profile_photo_url ? (
                    <div className="w-12 h-12 relative rounded-full overflow-hidden border border-hairline flex-shrink-0">
                      <Image src={s.profiles.profile_photo_url} alt="Avatar" fill sizes="48px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-ink border border-hairline flex items-center justify-center text-mist shrink-0 group-hover:text-coral transition-colors">
                      <UserCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-parchment truncate group-hover:text-coral transition-colors">{s.profiles?.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-mono text-mist uppercase tracking-wider border border-hairline px-2 py-0.5 rounded-md">ID: {s.student_id}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditError('')
                        setEditSuccess('')
                        setEditingStudent(s)
                        setIsEditModalOpen(true)
                      }}
                      className="text-mist hover:text-coral transition-colors p-1 opacity-0 group-hover:opacity-100"
                      title="Edit Student"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(s.profile_id); }}
                      className="text-mist hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                      title="Delete Student"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(groupedStudents).length === 0 && (
          <div className="surface-card rounded-[2rem] p-16 text-center border border-hairline">
            <UserX className="w-16 h-16 text-mist mx-auto mb-6 opacity-50" />
            <h2 className="font-display text-2xl font-bold text-parchment">No Students Found</h2>
            <p className="text-mist mt-2 max-w-sm mx-auto">Try adjusting your search criteria or add a new student to the directory.</p>
          </div>
        )}
      </div>

      {/* ── ADD STUDENT MODAL ── */}
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
                <h2 className="font-display text-2xl font-bold text-parchment">Add New Student</h2>
                <button onClick={handleCloseAddModal} className="text-mist hover:text-coral transition-colors">✕</button>
              </div>
              <form onSubmit={handleAddStudent} className="p-6 space-y-8">
                <AnimatePresence>
                  {addError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl flex items-center gap-3 text-sm font-mono">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{addError}</p>
                    </motion.div>
                  )}
                  {addSuccess && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-xl flex items-center gap-3 text-sm font-mono">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{addSuccess}</p>
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
                  <h3 className="text-xs font-bold text-coral uppercase tracking-widest border-b border-hairline pb-2">Student Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Full Name</label>
                      <input required type="text" name="fullName" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Student ID (Optional)</label>
                      <input type="text" name="studentId" placeholder="Auto-generated if left blank" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Class</label>
                      <select required name="classId" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral">
                        <option value="">-- Select Class --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.class_name} {c.section && c.section !== '-' ? `(${c.section})` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <DateInput label="Date of Birth" value={addDob} onChange={setAddDob} />
                      <input type="hidden" name="dob" value={addDob} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-coral uppercase tracking-widest border-b border-hairline pb-2">Family Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Father's Name</label>
                      <input type="text" name="fatherName" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Mother's Name</label>
                      <input type="text" name="motherName" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Contact Number</label>
                      <input type="tel" name="phone" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Address</label>
                      <input type="text" name="address" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-hairline rounded-xl space-y-4 bg-ink">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="createParent"
                      checked={createParent}
                      onChange={(e) => setCreateParent(e.target.checked)}
                      className="w-5 h-5 rounded border-hairline bg-ink text-coral focus:ring-coral" 
                    />
                    <span className="text-sm font-semibold text-parchment">Also create a Parent Account and link it</span>
                  </label>
                  
                  <AnimatePresence>
                    {createParent && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-hairline mt-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-mist uppercase tracking-wider">Parent Login Email</label>
                            <input required={createParent} type="email" name="parentEmail" className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-mist uppercase tracking-wider">Parent Password</label>
                            <input required={createParent} type="password" name="parentPassword" minLength={6} className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-6 flex gap-4 border-t border-hairline">
                  <button type="button" onClick={handleCloseAddModal} className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm bg-ink border border-hairline text-parchment hover:border-mist transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="flex-1 bg-coral text-ink py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#E67E6B] transition-colors">
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT STUDENT MODAL ── */}
      <AnimatePresence>
        {isEditModalOpen && editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card shadow-2xl rounded-3xl border border-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center sticky top-0 bg-ink/90 backdrop-blur-md z-10">
                <h2 className="font-display text-2xl font-bold text-parchment">Edit Student</h2>
                <button onClick={handleCloseEditModal} className="text-mist hover:text-coral transition-colors">✕</button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-8">
                <input type="hidden" name="profileId" value={editingStudent.profile_id} />
                
                <AnimatePresence>
                  {editError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl flex items-center gap-3 text-sm font-mono">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{editError}</p>
                    </motion.div>
                  )}
                  {editSuccess && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-xl flex items-center gap-3 text-sm font-mono">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{editSuccess}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-coral uppercase tracking-widest border-b border-hairline pb-2">Student Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Full Name</label>
                      <input required type="text" name="fullName" defaultValue={editingStudent.profiles?.full_name} className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Student ID / Roll No</label>
                      <input required type="text" name="studentId" defaultValue={editingStudent.student_id} className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Class</label>
                      <select required name="classId" defaultValue={editingStudent.class_id} className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral">
                        <option value="">-- Select Class --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.class_name} {c.section && c.section !== '-' ? `(${c.section})` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <DateInput label="Date of Birth" value={editDob} onChange={setEditDob} />
                      <input type="hidden" name="dob" value={editDob} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-coral uppercase tracking-widest border-b border-hairline pb-2">Family Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Father's Name</label>
                      <input type="text" name="fatherName" defaultValue={editingStudent.father_name} className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Mother's Name</label>
                      <input type="text" name="motherName" defaultValue={editingStudent.mother_name} className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Contact Number</label>
                      <input type="tel" name="phone" defaultValue={editingStudent.profiles?.mobile} className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist uppercase tracking-wider">Address</label>
                      <input type="text" name="address" defaultValue={editingStudent.profiles?.address} className="w-full input-glass rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-coral" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-4 border-t border-hairline">
                  <button type="button" onClick={handleCloseEditModal} className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm bg-ink border border-hairline text-parchment hover:border-mist transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending} className="flex-1 bg-coral text-ink py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#E67E6B] transition-colors">
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
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
