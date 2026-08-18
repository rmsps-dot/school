import { Users } from 'lucide-react'
import { getParentChildren } from '@/actions/portal-actions'
import { getUserPendingProfileRequest } from '@/actions/profile-request-actions'
import { createClient } from '@/utils/supabase/server'
import ParentProfileCard from '@/components/parent/ParentProfileCard'

export const dynamic = 'force-dynamic'

export default async function ParentDashboard() {
  const client = await createClient()

  // Run in parallel — much faster than sequential awaits
  const [
    { data: { user } },
    { data: children, error },
    { data: pendingRequest },
  ] = await Promise.all([
    client.auth.getUser(),
    getParentChildren(),
    getUserPendingProfileRequest(),
  ])

  // Fetch parent profile
  const { data: profile } = user
    ? await client.from('profiles').select('id, full_name, mobile, address, dob').eq('id', user.id).single()
    : { data: null }

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-8">
      {/* ── Big-Statement Hero ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-hairline pb-8">
        <div>
          <p className="text-mist text-sm font-mono tracking-widest uppercase mb-4">PARENT PORTAL</p>
          <div className="flex flex-col">
            <span className="font-display text-[3.5rem] md:text-[4.5rem] font-bold text-parchment leading-none tracking-tight">
              Welcome, <span className="text-gold">{profile?.full_name?.split(' ')[0] ?? 'Parent'}</span>
            </span>
            <span className="text-mist text-lg mt-3">
              Monitor your child&apos;s academic progress and manage your family profile.
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
      {!error && (!children || children.length === 0) && (
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

      {/* ── Parent Profile & Children Management ── */}
      {children && children.length > 0 && (
        <ParentProfileCard
          parentProfile={profile}
          children={children}
          initialPendingRequest={pendingRequest}
        />
      )}
    </div>
  )
}
