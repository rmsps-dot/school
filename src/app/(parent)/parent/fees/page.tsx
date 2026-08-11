import { Wallet } from 'lucide-react'
import { getParentChildren } from '@/actions/portal-actions'
import ParentFeesClient from './ParentFeesClient'

export const dynamic = 'force-dynamic'

export default async function ParentFeesPage() {
  const { data: children, error } = await getParentChildren()

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="surface-card border-hairline rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shadow-inner flex-shrink-0">
          <Wallet className="w-8 h-8 text-gold" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment">
            Fee Tracking
          </h1>
          <p className="text-mist mt-2 text-sm max-w-md">
            View your fee payment history and outstanding dues.
          </p>
        </div>
      </div>

      {error && (
        <div className="surface-card border-hairline rounded-2xl p-6 text-red-400 text-sm font-mono shadow-xl border-red-500/30">
          {error}
        </div>
      )}

      {!error && children.length === 0 && (
        <div className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
            <Wallet className="w-10 h-10 text-mist/50" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-parchment">No Children Linked</h2>
            <p className="text-mist text-sm max-w-md mt-2 mx-auto">
              No children are currently linked to your parent account. Please contact administration.
            </p>
          </div>
        </div>
      )}

      {children.length > 0 && (
        <ParentFeesClient children={children} />
      )}
    </div>
  )
}
