import Link from 'next/link'
import { fetchAdminStats } from '@/actions/admin-actions'
import StatCard from '@/components/admin/StatCard'
import { ArrowRight, Users, GraduationCap, ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const stats = await fetchAdminStats()

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-8">
      
      {/* ── Big-Statement Hero ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-hairline pb-12">
        <div>
          <p className="text-mist text-sm font-mono tracking-widest uppercase mb-4">ADMINISTRATION OVERVIEW</p>
          <div className="flex flex-col">
            <span className="font-display text-[5rem] font-bold text-coral leading-none tracking-tight">
              {stats.students.toLocaleString()}
            </span>
            <span className="text-parchment text-xl mt-2">Active Students Enrolled</span>
          </div>
        </div>
        <div className="text-mist max-w-sm leading-relaxed">
          The school is currently managing {stats.teachers} teachers and {stats.parents} registered parent accounts.
        </div>
      </div>

      {/* ── Action Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pending Approvals (Priority Action) */}
        <Link href="/admin/requests" className="md:col-span-2 surface-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group cursor-pointer block hover:border-coral/50 transition-colors border border-transparent">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center border border-coral/20">
                <ClipboardList className="w-6 h-6" />
              </div>
              {stats.pending > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-coral/10 text-coral border border-coral/20 uppercase tracking-widest">
                  Requires Attention
                </span>
              )}
            </div>
            <h2 className="font-display text-3xl font-bold text-parchment mb-2 group-hover:text-coral transition-colors">
              {stats.pending} Pending Requests
            </h2>
            <p className="text-mist max-w-md">
              {stats.pending === 0
                ? 'All admission and registration requests have been processed.'
                : 'There are new student and teacher applications awaiting your review and approval.'}
            </p>
          </div>
          <div className="mt-8 relative z-10">
            <span
              className="inline-flex items-center gap-3 text-sm font-semibold text-ink bg-coral px-6 py-3 rounded-xl group-hover:bg-[#E67E6B] transition-all"
            >
              Review Admissions <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>

        {/* Quick Stats Column */}
        <div className="flex flex-col gap-6">
          <div className="flex-1">
            <StatCard value={stats.teachers} label="Teachers Staff" href="/admin/teachers" />
          </div>
          <div className="flex-1">
            <StatCard value={stats.parents} label="Parent Accounts" href="/admin/parents" />
          </div>
        </div>

      </div>

      {/* ── Quick Links (Hairline borders) ── */}
      <div className="surface-card rounded-3xl p-8">
        <h2 className="font-display text-2xl font-bold text-parchment mb-6">Directory Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Manage Students', href: '/admin/students', icon: Users },
            { label: 'Manage Teachers', href: '/admin/teachers', icon: GraduationCap },
            { label: 'Manage Parents', href: '/admin/parents', icon: Users },
            { label: 'Classes & Subjects', href: '/admin/classes', icon: ClipboardList },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 p-4 rounded-2xl border border-hairline hover:border-coral/50 hover:bg-coral/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-mist group-hover:text-coral transition-colors">
                <link.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-parchment group-hover:text-coral transition-colors">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
