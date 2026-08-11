'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { Users, Search, Loader2, UserCircle, ArrowRight, FileSpreadsheet } from 'lucide-react'
import { type ClassWithSubject } from '@/actions/result-actions'
import { getStudentsByClass } from '@/actions/class-actions'
import ResultUploadModal from '@/components/teacher/ResultUploadModal'

export type TeacherClassStudent = Exclude<Awaited<ReturnType<typeof getStudentsByClass>>['data'], null>[number]

interface Props {
  classes: ClassWithSubject[]
}

export default function ClassesClient({ classes }: Props) {
  // Unique classes for the dropdown
  const uniqueClasses = Array.from(new Map(classes.map(c => [c.classId, c])).values())
  const uniqueClassIds = Array.from(new Set(classes.map(c => c.classId)))

  const [selectedClass, setSelectedClass] = useState<string>('')
  const [students, setStudents] = useState<TeacherClassStudent[]>([])
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const [modalTarget, setModalTarget] = useState<{
    classId: string
    className: string
    section: string
  } | null>(null)

  useEffect(() => {
    startTransition(async () => {
      if (selectedClass) {
        const { data } = await getStudentsByClass(selectedClass)
        if (data) setStudents(data)
      } else {
        // Fetch all assigned students
        const allStudents: TeacherClassStudent[] = []
        for (const cid of uniqueClassIds) {
          const { data } = await getStudentsByClass(cid)
          if (data) allStudents.push(...data)
        }
        // Deduplicate students
        const unique = Array.from(new Map(allStudents.map(s => [s.id, s])).values())
        setStudents(unique)
      }
    })
  }, [selectedClass])

  const filteredStudents = students.filter(s => 
    s.profiles?.[0]?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="surface-card p-4 rounded-2xl border border-hairline flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-64">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-ink/50 border border-hairline rounded-xl px-4 py-2.5 text-parchment focus:outline-none focus:border-veena-blue transition-colors cursor-pointer"
          >
            <option value="">All Assigned Classes</option>
            {uniqueClasses.map(c => (
              <option key={c.classId} value={c.classId}>
                {c.className} {c.section !== '-' ? `- ${c.section}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
          <input
            type="text"
            placeholder="Search students across your classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-ink/50 border border-hairline rounded-xl text-parchment focus:outline-none focus:border-veena-blue transition-all"
          />
        </div>
      </div>

      {/* Student List */}
      <div className="min-h-[400px]">
        {isPending ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-veena-blue" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-mist">
            <Users className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-mono uppercase tracking-widest text-sm">No students found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((s, i) => (
              <div 
                key={s.id}
                className="ledger-row surface-card border-hairline rounded-xl p-4 flex flex-col gap-4 transition-all hover:border-veena-blue/40 shadow-sm group"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="flex items-center gap-4">
                  {s.profiles?.[0]?.profile_photo_url ? (
                    <Image src={s.profiles[0].profile_photo_url} alt="Avatar" width={48} height={48} className="w-12 h-12 rounded-full object-cover border border-hairline flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-veena-blue/10 flex items-center justify-center text-veena-blue shrink-0">
                      <UserCircle className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-parchment truncate">{s.profiles?.[0]?.full_name}</h3>
                    <p className="text-[10px] text-mist font-mono tracking-widest mt-1">{s.student_id}</p>
                    <p className="text-xs text-veena-blue truncate mt-0.5">
                      {s.classes?.[0]?.class_name} {s.classes?.[0]?.section !== '-' ? `(${s.classes?.[0]?.section})` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-hairline flex">
                  <button
                    onClick={() => {
                      const c = uniqueClasses.find(cls => cls.classId === s.class_id)
                      if (c) {
                        setModalTarget({
                          classId: c.classId,
                          className: c.className,
                          section: c.section
                        })
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-veena-blue/10 text-veena-blue hover:bg-veena-blue hover:text-ink text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Upload Result
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result upload modal */}
      {modalTarget && (
        <ResultUploadModal
          classId={modalTarget.classId}
          className={modalTarget.className}
          section={modalTarget.section}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  )
}
