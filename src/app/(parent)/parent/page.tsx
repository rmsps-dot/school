import Link from 'next/link'
import { Users, TrendingUp, Wallet, GraduationCap, CalendarDays } from 'lucide-react'
import { getParentChildren } from '@/actions/portal-actions'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ParentDashboard() {
  const client = await createClient()

  // Run in parallel — much faster than sequential awaits
  const [
    { data: { user } },
    { data: children, error },
  ] = await Promise.all([
    client.auth.getUser(),
    getParentChildren(),
  ])

  // Fetch profile using the authenticated client (not supabaseAdmin)
  const { data: profile } = user
    ? await client.from('profiles').select('full_name').eq('id', user.id).single()
    : { data: null }

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-8">
      
      {/* ── Big-Statement Hero ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-hairline pb-12">
        <div>
          <p className="text-mist text-sm font-mono tracking-widest uppercase mb-4">PARENT PORTAL</p>
          <div className="flex flex-col">
            <span className="font-display text-[4rem] md:text-[5rem] font-bold text-parchment leading-none tracking-tight">
              Welcome, <span className="text-gold">{profile?.full_name?.split(' ')[0] ?? 'Parent'}</span>
            </span>
            <span className="text-mist text-xl mt-4">
              Monitor your child's academic progress and track fee ledgers in real-time.
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="surface-card rounded-2xl p-6 border border-red-500/30 text-red-400">
          <p className="font-mono text-sm">{error}</p>
        </div>
      )}

      {/* ── No children linked ── */}
      {!error && children.length === 0 && (
        <div className="surface-card rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-gold" />
          </div>
          <h2 className="font-display text-3xl font-bold text-parchment">No Children Linked</h2>
          <p className="text-mist max-w-md leading-relaxed">
            Your parent account has not been linked to any student profile yet. Please contact the school administration to link your children.
          </p>
        </div>
      )}

      {/* ── Children Cards & Actions ── */}
      {children.length > 0 && (
        <div className="space-y-12">
          
          <div>
            <h2 className="font-display text-3xl font-bold text-parchment mb-8">Registered Students</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map((child) => (
                <div key={child.studentRowId} className="surface-card rounded-[2rem] p-8 flex flex-col justify-between group relative overflow-hidden">
                  
                  <div className="relative z-10 flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30 text-gold font-display text-2xl font-bold">
                        {child.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-display text-2xl font-bold text-parchment">{child.fullName}</p>
                        <p className="text-mist font-mono text-sm tracking-widest mt-1">ID: {child.studentCode}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gold/10 text-gold border border-gold/20">
                      {child.relation}
                    </span>
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-mist">
                      <GraduationCap className="w-5 h-5 text-gold" />
                      <span className="font-semibold text-parchment">{child.className}</span> 
                      <span>— Section {child.section}</span>
                    </div>

                    <Link
                      href={`/parent/progress?id=${child.studentRowId}`}
                      className="inline-flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-semibold text-ink bg-gold hover:opacity-90 transition-all"
                    >
                      <TrendingUp className="w-4 h-4" />
                      View Academic Progress
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links Bento */}
          <div>
            <h2 className="font-display text-2xl font-bold text-parchment mb-6">Quick Navigation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Child Progress', href: '/parent/progress', icon: TrendingUp, desc: 'Results & report cards' },
                { label: 'Attendance logs', href: '/parent/progress', icon: CalendarDays, desc: 'Daily attendance records' },
                { label: 'Fee Tracking', href: '/parent/fees', icon: Wallet, desc: 'Due & paid fee ledgers' },
              ].map(({ label, href, icon: Icon, desc }) => (
                <Link key={label} href={href} className="surface-card rounded-3xl p-6 flex flex-col gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-ink text-mist flex items-center justify-center border border-hairline group-hover:border-gold/40 group-hover:text-gold transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-parchment group-hover:text-gold transition-colors">{label}</p>
                    <p className="text-mist text-sm mt-2">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
