import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, CalendarDays, Bell, ArrowRight, GraduationCap, MapPin, Phone, UserCheck } from 'lucide-react'
import { getStudentProfile, getStudentResults, getStudentAttendance } from '@/actions/portal-actions'
import { getUserPendingProfileRequest } from '@/actions/profile-request-actions'
import StudentProfileCard from '@/components/student/StudentProfileCard'

export const dynamic = 'force-dynamic'

export default async function StudentDashboard() {
  const [{ data: profile }, { data: results }, { data: attendance }, { data: pendingRequest }] = await Promise.all([
    getStudentProfile(),
    getStudentResults(),
    getStudentAttendance(),
    getUserPendingProfileRequest(),
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

  const approvedCount = results?.length ?? 0
  const pct = attendance?.percentage ?? 0
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
        {/* Left Col: Digital ID & Self-Edit Request Card */}
        <div className="lg:col-span-1 space-y-6">
          <StudentProfileCard profile={profile} initialPendingRequest={pendingRequest} />
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

          {/* Bottom Bento: Portal Features Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/student/homework" className="surface-card rounded-3xl p-8 border border-hairline hover:border-[#81B29A]/50 transition-colors group flex flex-col justify-between h-[160px]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#81B29A]/10 text-[#81B29A] flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono uppercase text-mist">Assignments</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-parchment">Homework & Tasks</span>
                <ArrowRight className="w-4 h-4 text-mist group-hover:text-[#81B29A] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link href="/student/notices" className="surface-card rounded-3xl p-8 border border-hairline hover:border-gold/50 transition-colors group flex flex-col justify-between h-[160px]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                  <Bell className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono uppercase text-mist">Bulletin</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-parchment">School Notices</span>
                <ArrowRight className="w-4 h-4 text-mist group-hover:text-gold group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
