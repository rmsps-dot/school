import { CalendarClock } from 'lucide-react'
import { fetchAllPendingLeaves } from '@/actions/leave-actions'
import AdminLeavesClient from './AdminLeavesClient'

export const dynamic = 'force-dynamic'

export default async function AdminLeavesPage() {
  const { data: pendingLeaves, error } = await fetchAllPendingLeaves()

  return (
    <div className="max-w-6xl mx-auto space-y-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <CalendarClock className="w-8 h-8 text-amber-400" /> Leave Approvals
        </h1>
        <p className="text-mist mt-2 text-sm max-w-xl">
          Review and approve pending leave requests from teachers and students.
        </p>
      </div>

      {error ? (
        <div className="glass rounded-xl p-6 border border-red-500/30 text-red-400 font-medium mt-6">
          Error loading leave requests: {error}
        </div>
      ) : (
        <AdminLeavesClient initialLeaves={pendingLeaves} />
      )}
    </div>
  )
}
