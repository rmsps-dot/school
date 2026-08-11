import Link from 'next/link'
import { BookOpen, CalendarDays, Bell, ArrowRight, GraduationCap, MapPin, Phone, UserCheck } from 'lucide-react'
import { getStudentProfile, getStudentResults, getStudentAttendance } from '@/actions/portal-actions'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function StudentDashboard() {
  const [{ data: profile }, { data: results }, { data: attendance }] = await Promise.all([
    getStudentProfile(),
    getStudentResults(),
    getStudentAttendance(),
  ])

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="surface-card rounded-[2rem] p-16 text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-[#81B29A]/10 border border-[#81B29A]/30 flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8 text-[#81B29A]" />
          </div>
          <h2 className="font-display text-3xl font-bold text-parchment">Profile Not Found</h2>
          <p className="text-mist text-sm leading-relaxed">
            Your student record has not been set up yet. Please contact the administration to verify your enrollment.
          </p>
        </div>
      </div>
    )
  }

  const approvedCount  = results?.length ?? 0
  const pct            = attendance?.percentage ?? 0
  const attendanceColor = pct >= 75 ? 'text-gold' : pct >= 50 ? 'text-coral' : 'text-red-400'

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-8">
      
      {/* ── Big-Statement Hero ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-hairline pb-12">
        <div>
          <p className="text-mist text-sm font-mono tracking-widest uppercase mb-4">STUDENT PORTAL</p>
          <div className="flex flex-col">
            <span className="font-display text-[4rem] md:text-[5rem] font-bold text-parchment leading-none tracking-tight">
              Welcome, <span className="text-[#81B29A]">{profile.fullName.split(' ')[0]}</span>
            </span>
            <span className="text-mist text-xl mt-4">
              {profile.className} — Section {profile.section} &nbsp;·&nbsp; ID: {profile.studentCode}
            </span>
          </div>
        </div>
      </div>

      {/* ── Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Digital ID & Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Digital ID Card (Masterplan Glass) */}
          <div className="relative group overflow-hidden rounded-[2rem] glass-panel p-6 border border-hairline hover:border-[#81B29A]/40 transition-all duration-500 shadow-xl">
            {/* Light sweep animation */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_ease-out] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#81B29A]/20 flex items-center justify-center border border-[#81B29A]/30 text-[#81B29A] font-display text-2xl font-bold">
                {profile.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-display text-xl font-bold text-parchment">{profile.fullName}</p>
                <p className="text-[#81B29A] font-mono text-sm tracking-widest mt-1">STUDENT ID</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-hairline pb-2">
                <span className="text-mist text-xs uppercase tracking-widest">Enrollment</span>
                <span className="text-parchment font-mono text-sm">{fmtDate(profile.admissionDate)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-hairline pb-2">
                <span className="text-mist text-xs uppercase tracking-widest">D.O.B</span>
                <span className="text-parchment font-mono text-sm">{fmtDate(profile.dob)}</span>
              </div>
              {profile.mobile && (
                <div className="flex justify-between items-end border-b border-hairline pb-2">
                  <span className="text-mist text-xs uppercase tracking-widest">Contact</span>
                  <span className="text-parchment font-mono text-sm">{profile.mobile}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Col: Stats & Quick Links Bento */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <Link href="/student/results" className="surface-card rounded-3xl p-8 flex flex-col justify-between group h-[180px]">
              <div>
                <p className="text-mist text-sm font-medium tracking-wide uppercase mb-1">Approved Results</p>
                <div className="flex items-end gap-3">
                  <p className="text-5xl font-display font-bold text-parchment group-hover:text-[#81B29A] transition-colors">
                    {approvedCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#81B29A] text-sm font-semibold mt-auto">
                View Records <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/student/attendance" className="surface-card rounded-3xl p-8 flex flex-col justify-between group h-[180px]">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-mist text-sm font-medium tracking-wide uppercase mb-1">Attendance</p>
                  {pct < 75 && pct > 0 && (
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                      Low
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-3">
                  <p className={`text-5xl font-display font-bold transition-colors ${attendanceColor}`}>
                    {pct}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-mist group-hover:text-parchment text-sm font-semibold mt-auto transition-colors">
                View History <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

          </div>

          {/* Quick Nav Row */}
          <div className="surface-card rounded-3xl p-8">
            <h2 className="font-display text-2xl font-bold text-parchment mb-6">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Exam Results', href: '/student/results', icon: BookOpen },
                { label: 'Attendance logs', href: '/student/attendance', icon: CalendarDays },
                { label: 'School Notices', href: '/student/notices', icon: Bell },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-hairline hover:border-[#81B29A]/40 hover:bg-[#81B29A]/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-mist group-hover:text-[#81B29A] transition-colors">
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-parchment group-hover:text-[#81B29A] transition-colors">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

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
