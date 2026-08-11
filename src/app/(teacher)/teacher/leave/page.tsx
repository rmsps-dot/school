import { Calendar } from 'lucide-react'
import { fetchMyLeaves } from '@/actions/leave-actions'
import LeaveApplicationForm from '@/components/shared/LeaveApplicationForm'

export const dynamic = 'force-dynamic'

export default async function TeacherLeavePage() {
  const { data: leaves, error } = await fetchMyLeaves()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Calendar className="w-7 h-7 text-violet-400" /> Leave Application
        </h1>
        <p className="text-mist text-sm mt-1">Submit your leave requests for administrative approval.</p>
      </div>

      {error ? (
        <div className="glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm">{error}</div>
      ) : (
        <LeaveApplicationForm pastLeaves={leaves} roleName="Teacher" />
      )}
    </div>
  )
}
