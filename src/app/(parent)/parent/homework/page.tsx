import { BookOpen } from 'lucide-react'
import { getParentChildren } from '@/actions/portal-actions'
import { fetchRecentHomework } from '@/actions/homework-actions'
import ParentHomeworkClient from './ParentHomeworkClient'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ id?: string }>
}

export default async function ParentHomeworkPage({ searchParams }: Props) {
  const params = await searchParams
  const [{ data: children, error: childErr }, { data: homework, error: hwErr }] = await Promise.all([
    getParentChildren(),
    fetchRecentHomework()
  ])

  const error = childErr || hwErr

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="surface-card border-hairline rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shadow-inner flex-shrink-0">
          <BookOpen className="w-8 h-8 text-gold" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment">
            Daily Homework
          </h1>
          <p className="text-mist mt-2 text-sm max-w-md">
            Keep track of daily assignments for your children.
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
            <BookOpen className="w-10 h-10 text-mist/50" />
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
        <ParentHomeworkClient childrenData={children} homeworkData={homework} defaultId={params.id} />
      )}
    </div>
  )
}
