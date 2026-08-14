'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  UserCircle, Calendar, MapPin, Phone, Mail, 
  CreditCard, BookOpen, CalendarDays, ArrowLeft,
  GraduationCap, TrendingUp, CheckCircle2, XCircle, Edit
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { getStudentProfileData } from '@/actions/class-actions'

type StudentProfileDataPayload = Exclude<Awaited<ReturnType<typeof getStudentProfileData>>['data'], null>

interface StudentProfileProps {
  data: StudentProfileDataPayload
}

type TabType = 'details' | 'fees' | 'progress' | 'attendance'

export default function StudentProfileClient({ data }: StudentProfileProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'details' | 'fees' | 'progress' | 'attendance'>('details')

  const { student, attendanceStats, results } = data
  const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles

  // 3D Tilt effect handlers for ID card
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const box = card.getBoundingClientRect()
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    const centerX = box.width / 2
    const centerY = box.height / 2
    setRotateX(((y - centerY) / centerY) * -8)
    setRotateY(((x - centerX) / centerX) * 8)
  }

  const handleMouseLeave = () => { setRotateX(0); setRotateY(0) }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const attendancePct = attendanceStats.percentage
  const attendanceColor = attendancePct >= 75 ? 'var(--coral)' : attendancePct >= 50 ? '#D4AF6A' : '#EF4444'

  const cls = Array.isArray(student.classes) ? student.classes[0] : student.classes

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'details',    label: 'Details',     icon: UserCircle },
    { id: 'fees',       label: 'Fees',         icon: CreditCard },
    { id: 'progress',   label: 'Progress',     icon: BookOpen },
    { id: 'attendance', label: 'Attendance',   icon: CalendarDays },
  ]

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-mist hover:text-parchment transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Students</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: 3D Digital ID Card */}
        <div className="lg:col-span-1" style={{ perspective: '1000px' }}>
          <motion.div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ rotateX, rotateY }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer glass-panel"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* ID Card Header */}
            <div 
              className="p-5 flex items-center justify-between border-b border-hairline"
              style={{ 
                background: 'linear-gradient(135deg, rgba(241,145,125,0.15) 0%, rgba(212,175,106,0.08) 100%)',
                transform: 'translateZ(20px)'
              }}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-coral" />
                <span className="font-display font-bold text-parchment tracking-wider text-sm">STUDENT ID</span>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-coral/30 flex-shrink-0"
                style={{ background: 'rgba(241,145,125,0.1)' }}>
                <Image src="/icon-192.png" alt="RMSPS Logo" width={32} height={32} className="object-cover" />
              </div>
            </div>

            {/* ID Card Content */}
            <div className="p-6 flex flex-col items-center relative" style={{ transform: 'translateZ(30px)' }}>
              
              <div className="relative mb-5">
                <AvatarUpload 
                  currentPhotoUrl={profile?.profile_photo_url} 
                  userId={student.profile_id}
                  size="xl"
                  onUploadSuccess={() => router.refresh()}
                />
                <div className="absolute -bottom-3 -right-3 text-[10px] font-bold px-2 py-1 rounded-lg border border-coral/30 text-coral"
                  style={{ background: 'var(--ink)', boxShadow: '0 0 12px rgba(241,145,125,0.2)' }}>
                  {cls?.class_name}-{cls?.section}
                </div>
              </div>

              <h2 className="font-display text-xl font-bold text-parchment mb-1 text-center leading-tight">
                {profile?.full_name?.toUpperCase() || 'STUDENT NAME'}
              </h2>
              <p className="font-mono text-sm tracking-widest mb-6" style={{ color: 'var(--coral)' }}>
                {student.student_id}
              </p>

              <div className="w-full space-y-3 text-xs">
                {[
                  { label: 'D.O.B',   value: formatDate(profile?.dob) },
                  { label: 'FATHER',  value: student.father_name || 'N/A' },
                  { label: 'MOTHER',  value: student.mother_name || 'N/A' },
                  { label: 'PHONE',   value: profile?.mobile || 'N/A' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between border-b border-hairline pb-2">
                    <span className="text-mist font-mono tracking-wider">{row.label}</span>
                    <span className="text-parchment font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Card Footer — decorative barcode */}
            <div className="px-6 pb-5 flex items-center justify-center border-t border-hairline" style={{ transform: 'translateZ(10px)' }}>
              <div className="w-3/4 h-8 flex items-end justify-between opacity-20 mt-4">
                {[...Array(22)].map((_, i) => (
                  <div key={i} className={`bg-parchment ${i % 3 === 0 ? 'h-full w-[3px]' : i % 2 === 0 ? 'h-3/4 w-[1px]' : 'h-full w-[1px]'}`} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COL: Data Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="surface-card rounded-2xl p-1.5 flex flex-wrap gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? 'text-ink' 
                    : 'text-mist hover:text-parchment'
                }`}
                style={activeTab === tab.id ? { background: 'var(--coral)', boxShadow: '0 0 20px rgba(241,145,125,0.25)' } : {}}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline min-h-[400px]">

            {/* ── DETAILS TAB ── */}
            {activeTab === 'details' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h3 className="font-display text-xl font-bold text-parchment border-b border-hairline pb-4">Personal Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: UserCircle, label: 'Full Name',         value: profile?.full_name },
                    { icon: Calendar,   label: 'Date of Birth',     value: formatDate(profile?.dob) },
                    { icon: UserCircle, label: "Father's Name",     value: student.father_name || 'N/A' },
                    { icon: UserCircle, label: "Mother's Name",     value: student.mother_name || 'N/A' },
                    { icon: Phone,      label: 'Primary Phone',     value: profile?.mobile || 'N/A' },
                    { icon: Mail,       label: 'Email Address',     value: profile?.email || 'N/A', wide: false },
                    { icon: MapPin,     label: 'Residential Address', value: profile?.address || 'No address provided.', wide: true },
                  ].map((item, idx) => (
                    <div key={idx} className={item.wide ? 'md:col-span-2' : ''}>
                      <span className="text-xs text-mist uppercase font-semibold tracking-wider flex items-center gap-1.5 mb-1">
                        <item.icon className="w-3.5 h-3.5" /> {item.label}
                      </span>
                      <p className="text-parchment font-medium text-base break-all">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-hairline flex justify-end">
                  <button 
                    onClick={() => router.push(`/admin/students?edit=${student.id}`)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] text-ink"
                    style={{ background: 'var(--coral)' }}
                  >
                    <Edit className="w-4 h-4" /> Edit Student Data
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── FEES TAB ── */}
            {activeTab === 'fees' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h3 className="font-display text-xl font-bold text-parchment border-b border-hairline pb-4">Fee Overview</h3>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-hairline"
                    style={{ background: 'rgba(212,175,106,0.06)' }}>
                    <CreditCard className="w-8 h-8 text-mist/40" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-parchment mb-2">No Fee Records Found</h4>
                  <p className="text-mist text-sm max-w-md">
                    There are currently no fee records or transactions linked to this student.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── PROGRESS REPORT TAB ── */}
            {activeTab === 'progress' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h3 className="font-display text-xl font-bold text-parchment border-b border-hairline pb-4">Academic Progress</h3>
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-hairline"
                      style={{ background: 'rgba(62,92,118,0.1)' }}>
                      <BookOpen className="w-8 h-8 text-mist/40" />
                    </div>
                    <h4 className="font-display text-lg font-bold text-parchment mb-2">No Results Found</h4>
                    <p className="text-mist text-sm max-w-md">No exam or test results have been uploaded for this student yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-hairline">
                          <th className="pb-3 text-xs font-bold text-mist uppercase tracking-wider">Exam / Test</th>
                          <th className="pb-3 text-xs font-bold text-mist uppercase tracking-wider">Subject</th>
                          <th className="pb-3 text-xs font-bold text-mist uppercase tracking-wider text-center">Marks</th>
                          <th className="pb-3 text-xs font-bold text-mist uppercase tracking-wider text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {results.map((res) => {
                          const total = res.total_marks || res.max_marks || 1
                          const pct = (res.marks_obtained / total) * 100
                          let calculatedGrade = 'F'
                          if (pct >= 90) calculatedGrade = 'A+'
                          else if (pct >= 80) calculatedGrade = 'A'
                          else if (pct >= 70) calculatedGrade = 'B+'
                          else if (pct >= 60) calculatedGrade = 'B'
                          else if (pct >= 50) calculatedGrade = 'C'
                          else if (pct >= 40) calculatedGrade = 'D'
                          
                          const gradeColor = pct >= 75 ? 'text-emerald-400 border-emerald-500/30' : pct >= 50 ? 'text-gold border-gold/30' : 'text-red-400 border-red-500/30'
                          return (
                            <tr key={res.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="py-3 pr-4 text-sm text-parchment font-medium capitalize">{res.exam_type.replace('_', ' ')}</td>
                              <td className="py-3 pr-4 text-sm text-mist">{res.subject}</td>
                              <td className="py-3 text-sm text-parchment text-center font-bold font-mono">
                                {res.marks_obtained} <span className="text-mist font-normal">/ {res.total_marks || res.max_marks}</span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${gradeColor}`}
                                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                                  {calculatedGrade}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ATTENDANCE TAB ── */}
            {activeTab === 'attendance' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h3 className="font-display text-xl font-bold text-parchment border-b border-hairline pb-4">Attendance Summary</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Days',  value: attendanceStats.total,   color: 'text-mist',        bg: 'rgba(138,143,152,0.06)' },
                    { label: 'Present',     value: attendanceStats.present,  color: 'text-emerald-400', bg: 'rgba(16,185,129,0.06)' },
                    { label: 'Absent',      value: attendanceStats.total - attendanceStats.present, color: 'text-red-400', bg: 'rgba(239,68,68,0.06)' },
                    { label: 'Percentage',  value: `${attendanceStats.percentage}%`, color: 'text-coral', bg: 'rgba(241,145,125,0.06)' },
                  ].map(stat => (
                    <div key={stat.label} className="surface-card rounded-2xl p-4 text-center border border-hairline">
                      <p className="text-xs text-mist font-semibold mb-2 uppercase tracking-wider">{stat.label}</p>
                      <p className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Attendance bar */}
                <div className="surface-card rounded-2xl p-5 border border-hairline">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-mist">Attendance Rate</span>
                    <span className="text-sm font-bold font-mono" style={{ color: attendanceColor }}>{attendancePct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-ink border border-hairline overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${attendancePct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${attendanceColor}, ${attendanceColor}80)` }}
                    />
                  </div>
                  <p className="text-xs text-mist mt-3 text-center">
                    {attendancePct >= 75
                      ? '✓ Attendance is satisfactory'
                      : attendancePct >= 50
                      ? '⚠ Attendance is below recommended level'
                      : '✗ Attendance is critically low — action required'}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-6 text-center border border-hairline rounded-2xl"
                  style={{ background: 'rgba(138,143,152,0.03)' }}>
                  <CalendarDays className="w-10 h-10 text-mist/30 mb-3" />
                  <p className="text-mist text-sm max-w-md">
                    Detailed daily attendance logs can be managed from the Class Dashboard Attendance tab.
                  </p>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
