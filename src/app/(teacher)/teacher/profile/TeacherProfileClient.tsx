'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { UserCircle, MapPin, Phone, Calendar, BookOpen, Mail } from 'lucide-react'
import AvatarUpload from '@/components/ui/AvatarUpload'

export interface TeacherProfileData {
  teacher_id: string
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
}

export default function TeacherProfileClient({ teacher }: Props) {
  const router = useRouter()
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

  const handleMouseLeave = () => { setRotateX(0); setRotateY(0) }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const rows = [
    { icon: Mail,     label: 'Email',   value: teacher.profiles?.email || 'N/A' },
    { icon: Calendar, label: 'D.O.B',   value: formatDate(teacher.profiles?.dob) },
    { icon: Phone,    label: 'Number',  value: teacher.profiles?.mobile || 'N/A' },
    { icon: MapPin,   label: 'Address', value: teacher.profiles?.address || 'N/A' },
  ]

  return (
    <div className="flex flex-col items-center justify-center p-8" style={{ perspective: '1000px' }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
        className="relative rounded-3xl overflow-hidden w-full max-w-md glass-panel border border-hairline shadow-2xl"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ID Card Header */}
        <div
          className="p-5 flex items-center justify-between border-b border-hairline"
          style={{
            background: 'linear-gradient(135deg, rgba(62,92,118,0.2) 0%, rgba(62,92,118,0.08) 100%)',
            transform: 'translateZ(20px)'
          }}
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-veena-blue" />
            <span className="font-display font-bold text-parchment tracking-wider">TEACHER ID</span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-veena-blue/30 flex-shrink-0"
            style={{ background: 'rgba(62,92,118,0.1)' }}>
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
            <div className="absolute -bottom-3 -right-3 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-veena-blue/30 text-veena-blue"
              style={{ background: 'var(--ink)', boxShadow: '0 0 12px rgba(62,92,118,0.2)' }}>
              FACULTY
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-parchment mb-1 text-center leading-tight">
            {teacher.profiles?.full_name?.toUpperCase() || 'UNKNOWN'}
          </h2>
          <p className="font-mono text-base tracking-widest mb-8 text-veena-blue">
            {teacher.teacher_id || 'ID-PENDING'}
          </p>

          <div className="w-full space-y-3 text-sm">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between border-b border-hairline pb-3">
                <span className="text-mist flex items-center gap-2">
                  <row.icon className="w-4 h-4" /> {row.label}
                </span>
                <span className="text-parchment font-medium text-right max-w-[200px] truncate">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative barcode footer */}
        <div className="px-8 pb-6 flex items-center justify-center border-t border-hairline" style={{ transform: 'translateZ(10px)' }}>
          <div className="w-3/4 h-7 flex items-end justify-between opacity-20 mt-4">
            {[...Array(22)].map((_, i) => (
              <div key={i} className={`bg-parchment ${i % 3 === 0 ? 'h-full w-[3px]' : i % 2 === 0 ? 'h-3/4 w-[1px]' : 'h-full w-[1px]'}`} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
