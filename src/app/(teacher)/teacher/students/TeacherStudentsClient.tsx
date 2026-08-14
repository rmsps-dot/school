'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, UserCircle, Loader2, GraduationCap, ArrowLeft, Plus } from 'lucide-react'
import { getStudentsByClass } from '@/actions/class-actions'
import type { StudentViewRecord } from '@/actions/class-actions'
import type { ClassWithSubject } from '@/actions/result-actions'

interface Props {
  classes: ClassWithSubject[]
}

export default function TeacherStudentsClient({ classes }: Props) {
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [students, setStudents] = useState<StudentViewRecord[]>([])
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  // 3D ID Card State
  const [viewStudent, setViewStudent] = useState<StudentViewRecord | null>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  useEffect(() => {
    startTransition(async () => {
      const res = await getStudentsByClass(selectedClass || undefined)
      if (res.data) setStudents(res.data)
    })
  }, [selectedClass])

  const filteredStudents = students.filter(s => 
    s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(search.toLowerCase())
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const box = card.getBoundingClientRect()
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    const centerX = box.width / 2
    const centerY = box.height / 2
    
    const rotateXValue = ((y - centerY) / centerY) * -10 
    const rotateYValue = ((x - centerX) / centerX) * 10
    
    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="surface-card p-4 rounded-2xl border border-hairline flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-64">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-ink/50 border border-hairline rounded-xl px-4 py-2.5 text-parchment focus:outline-none focus:border-coral/60 transition-colors"
          >
            <option value="">Select a Class</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>
                {c.className} - {c.section}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
          <input
            type="text"
            placeholder="Search students across all your classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-ink/50 border border-hairline rounded-xl text-parchment focus:outline-none focus:border-coral/60 transition-all"
          />
        </div>
      </div>

      <div className="min-h-[400px]">
        {isPending ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-coral" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-mist">
            <UserCircle className="w-16 h-16 mb-4 opacity-50" />
            <p>No students found for this class.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map(s => (
              <div 
                key={s.id}
                onClick={() => setViewStudent(s)}
                className="surface-card hover:bg-white/[0.02] border border-hairline rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors"
              >
                {s.profiles?.profile_photo_url ? (
                  <div className="w-12 h-12 relative rounded-full overflow-hidden border border-hairline flex-shrink-0">
                    <Image src={s.profiles.profile_photo_url} alt="Avatar" fill sizes="48px" className="object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-coral/20 flex items-center justify-center text-coral shrink-0">
                    <UserCircle className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-parchment truncate">{s.profiles?.full_name}</h3>
                  <p className="text-xs text-mist font-mono">ID: {s.student_id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3D ID Card Modal */}
      <AnimatePresence>
        {viewStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 perspective-1000"
          >
            <div className="absolute inset-0 cursor-pointer" onClick={() => setViewStudent(null)} />
            
            <motion.div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              animate={{ rotateX, rotateY }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
              className="relative rounded-2xl overflow-hidden preserve-3d w-full max-w-sm shadow-2xl glass-panel border border-hairline"
              style={{ 
                background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)',
              }}
            >
              {/* ID Card Header */}
              <div className="bg-coral/10 p-4 flex items-center justify-between border-b border-hairline" style={{ transform: 'translateZ(20px)' }}>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-coral" />
                  <span className="font-bold text-coral tracking-wide text-sm font-display">DIGITAL ID CARD</span>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-coral/20 border border-coral/30 flex-shrink-0">
                  <Image src="/icon-192.png" alt="RMSPS Logo" width={32} height={32} className="object-cover" />
                </div>
              </div>

              {/* ID Card Content */}
              <div className="p-6 flex flex-col items-center relative" style={{ transform: 'translateZ(30px)' }}>
                <div className="relative mb-4">
                {viewStudent.profiles?.profile_photo_url ? (
                    <div className="w-28 h-28 relative rounded-2xl overflow-hidden border border-hairline shadow-lg flex-shrink-0">
                      <Image 
                        src={viewStudent.profiles.profile_photo_url} 
                        alt="Student Photo" 
                        fill
                        sizes="(max-width: 768px) 112px, 112px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-coral/10 flex items-center justify-center border border-hairline shadow-lg text-coral">
                      <UserCircle className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute -bottom-3 -right-3 bg-coral text-ink text-[10px] font-bold px-2 py-1 rounded-lg border-2 border-ink shadow-xl">
                    {viewStudent.classes?.class_name}-{viewStudent.classes?.section}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-parchment mb-1 text-center leading-tight">
                  {viewStudent.profiles?.full_name?.toUpperCase()}
                </h2>
                <p className="text-mist font-mono text-sm tracking-wider mb-6">
                  {viewStudent.student_id}
                </p>

                <div className="w-full space-y-3 text-xs">
                  <div className="flex justify-between border-b border-hairline pb-2">
                    <span className="text-mist">D.O.B</span>
                    <span className="text-sm text-parchment font-medium font-mono">{formatDate(viewStudent.profiles?.dob || '')}</span>
                  </div>
                  <div className="flex justify-between border-b border-hairline pb-2">
                    <span className="text-mist">FATHER</span>
                    <span className="text-parchment font-medium">{viewStudent.father_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-hairline pb-2">
                    <span className="text-mist">MOTHER</span>
                    <span className="text-parchment font-medium">{viewStudent.mother_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-hairline pb-2">
                    <span className="text-mist">PHONE</span>
                    <span className="text-parchment font-medium font-mono">{viewStudent.profiles?.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-hairline pb-2">
                    <span className="text-mist">ADDRESS</span>
                    <span className="text-parchment font-medium text-right max-w-[150px] truncate">{viewStudent.profiles?.address || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="mt-6 w-full flex gap-2">
                   <button 
                     onClick={() => alert("Edit request functionality coming soon!")}
                     className="flex-1 bg-white/5 border border-hairline hover:bg-white/10 text-parchment py-2 rounded-xl text-xs font-bold transition-colors"
                   >
                     Request Edit
                   </button>
                   <button 
                     onClick={() => setViewStudent(null)}
                     className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                   >
                     Close
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}} />
    </div>
  )
}
