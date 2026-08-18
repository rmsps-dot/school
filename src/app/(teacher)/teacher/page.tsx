import Link from 'next/link'
import Image from 'next/image'
import { Camera, BookOpen, Upload, ArrowRight, Calendar, UserCheck } from 'lucide-react'
import { getTeacherProfile } from '@/actions/teacher-actions'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboard() {
  const { data: teacher } = await getTeacherProfile()

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const quickLinks = [
    {
      href: '/teacher/attendance',
      icon: Camera,
      label: 'Mark Today\'s Attendance',
      desc: 'Geofenced photo attendance',
    },
    {
      href: '/teacher/classes',
      icon: Upload,
      label: 'Upload Results',
      desc: 'Select assigned class & upload marks',
    },
    {
      href: '/teacher/manage-results',
      icon: BookOpen,
      label: 'Manage Results',
      desc: 'View & manage uploaded result sheets',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-8">
      
      {/* ── Big-Statement Hero ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-hairline pb-12">
        <div>
          <p className="text-mist text-sm font-mono tracking-widest uppercase mb-4">TEACHER PORTAL</p>
          <div className="flex flex-col">
            <span className="font-display text-[4rem] md:text-[5rem] font-bold text-veena-blue leading-none tracking-tight">
              {dateStr.split(',')[0]}
            </span>
            <span className="text-parchment text-xl mt-2">{dateStr}</span>
          </div>
        </div>
        <div className="text-mist max-w-sm leading-relaxed">
          Manage your classes, record attendance, and upload student results securely.
        </div>
      </div>

      {/* ── Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: ID Card & Action */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Digital ID Card with Masterplan Glass + Light Sweep */}
          <Link 
            href="/teacher/profile"
            className="block relative group overflow-hidden rounded-[2rem] glass-panel p-6 border border-hairline hover:border-veena-blue/40 transition-all duration-500 shadow-xl cursor-pointer"
          >
            {/* Light sweep animation on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_ease-out] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-6">
              {teacher?.profiles?.profile_photo_url ? (
                <div className="w-16 h-16 rounded-full overflow-hidden relative border border-veena-blue/40 shadow-inner flex-shrink-0">
                  <Image 
                    src={teacher.profiles.profile_photo_url} 
                    alt={teacher.profiles.full_name || 'Teacher Photo'} 
                    fill 
                    sizes="64px" 
                    className="object-cover" 
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-veena-blue/20 flex items-center justify-center border border-veena-blue/30 text-veena-blue flex-shrink-0">
                  <UserCheck className="w-8 h-8" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-parchment truncate">
                  {teacher?.profiles?.full_name || 'Teacher ID'}
                </p>
                <p className="text-veena-blue font-mono text-xs tracking-widest mt-0.5 truncate">
                  {teacher?.teacher_id || 'ACTIVE'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-hairline pb-2">
                <span className="text-mist text-xs uppercase tracking-widest">Status</span>
                <span className="text-parchment font-mono text-sm">Verified Faculty</span>
              </div>
              <div className="flex justify-between items-end border-b border-hairline pb-2">
                <span className="text-mist text-xs uppercase tracking-widest">Access</span>
                <span className="text-parchment font-mono text-sm">Classroom / Web</span>
              </div>
            </div>
          </Link>

        </div>

        {/* Right Col: Quick Links Bento */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Priority CTA */}
          <div className="sm:col-span-2 surface-card rounded-3xl p-8 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-veena-blue/10 text-veena-blue flex items-center justify-center border border-veena-blue/20 mb-6 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-parchment mb-2">
                Daily Attendance
              </h2>
              <p className="text-mist max-w-md">
                Securely record student attendance using geofenced location and live camera capture.
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/teacher/attendance"
                className="inline-flex items-center gap-3 text-sm font-semibold text-ink bg-veena-blue px-6 py-3 rounded-xl hover:opacity-90 transition-all"
              >
                Mark Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Regular Quick Links */}
          {quickLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="surface-card rounded-3xl p-6 flex flex-col gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-ink text-mist flex items-center justify-center border border-hairline group-hover:border-veena-blue/40 group-hover:text-veena-blue transition-colors">
                <link.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-parchment font-semibold">{link.label}</p>
                <p className="text-mist text-sm mt-1">{link.desc}</p>
              </div>
            </Link>
          ))}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(12deg); }
          100% { transform: translateX(200%) skewX(12deg); }
        }
      `}} />
    </div>
  )
}
