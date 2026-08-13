'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, UserCircle, Phone, Calendar, MapPin, GraduationCap, Users, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AvatarUpload from '@/components/ui/AvatarUpload'
import ParentEditModal from '@/components/admin/ParentEditModal'

export interface ParentDetailData {
  id: string
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

interface Props {
  parent: ParentDetailData
}

export default function ParentDetailClient({ parent }: Props) {
  const router = useRouter()
  const profile = parent.profiles || ({} as Partial<NonNullable<ParentDetailData['profiles']>>)
  const children = parent.parent_students || []

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const formatDate = (d?: string) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-4">
        <Link href="/admin/parents" className="p-2 rounded-xl surface-card border border-hairline hover:border-mist/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-parchment" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-parchment leading-tight">Parent Profile</h1>
          <p className="text-mist text-sm">Detailed View</p>
        </div>
      </div>

      {/* ── Profile Header Card ── */}
      <div className="glass-panel rounded-2xl p-6 border border-hairline relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />

        <div className="shrink-0 relative z-10">
          <AvatarUpload 
            currentPhotoUrl={profile.profile_photo_url} 
            userId={parent.id}
            size="lg"
            onUploadSuccess={() => router.refresh()}
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-3 relative z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-parchment mb-2">{profile.full_name}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider text-gold border border-gold/30"
                  style={{ background: 'rgba(212,175,106,0.08)' }}>
                  Parent / Guardian
                </span>
                <span className="text-mist text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined: {formatDate(parent.created_at)}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-hairline hover:border-coral/40 text-mist hover:text-coral transition-all flex items-center justify-center gap-2 text-sm font-bold bg-white/5 mx-auto md:mx-0 shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
            <div className="flex items-center gap-2 text-parchment surface-card px-3 py-1.5 rounded-lg border border-hairline">
              <Phone className="w-4 h-4 text-mist" />
              {profile.mobile || 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-parchment surface-card px-3 py-1.5 rounded-lg border border-hairline">
              <MapPin className="w-4 h-4 text-mist" />
              {profile.address || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Linked Students Section ── */}
      <div className="surface-card rounded-2xl p-6 border border-hairline">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-base font-bold text-parchment flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            Linked Students ({children.length})
          </h3>
        </div>

        {children.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {children.map((ps: NonNullable<ParentDetailData["parent_students"]>[0], i: number) => {
              const student = ps.students
              if (!student) return null
              const sprof = student.profiles || ({} as { profile_photo_url?: string | null, full_name?: string | null })
              const cls = student.classes || ({} as { class_name?: string, section?: string })

              return (
                <motion.div
                  key={student.student_id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="surface-card rounded-xl border border-hairline p-4 flex items-center gap-4 hover:border-coral/20 transition-all group"
                >
                  <div className="shrink-0">
                    {sprof.profile_photo_url ? (
                      <div className="w-14 h-14 relative rounded-full overflow-hidden border-2 border-hairline group-hover:border-coral/40 transition-colors flex-shrink-0">
                        <Image src={sprof.profile_photo_url} alt="Student" fill sizes="56px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center border border-hairline group-hover:border-coral/40 transition-colors"
                        style={{ background: 'rgba(241,145,125,0.06)' }}>
                        <GraduationCap className="w-6 h-6 text-coral/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-parchment truncate">{sprof.full_name}</h4>
                    <p className="text-xs font-mono text-coral mb-1">{student.student_id}</p>
                    <div className="flex items-center gap-3 text-xs text-mist">
                      <span className="font-medium text-mist">Class: {cls.class_name}</span>
                      <span className="w-1 h-1 rounded-full bg-mist/40" />
                      <span className="font-medium text-mist">Sec: {cls.section || '—'}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-coral/20 text-coral hover:bg-coral/10 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-mist italic surface-card rounded-xl border border-hairline">
            No students currently linked to this parent.
          </div>
        )}
      </div>
      
      {/* Edit Parent Modal */}
      {profile && (
        <ParentEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          parent={{
            id: parent.id,
            full_name: profile.full_name || null,
            mobile: profile.mobile || null,
            address: profile.address || null,
            dob: profile.dob || null
          }}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
