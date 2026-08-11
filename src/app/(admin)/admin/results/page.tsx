import { ClipboardCheck } from 'lucide-react'
import { fetchPendingResults, fetchModificationRequests } from '@/actions/admin-result-actions'
import ResultsClient from './ResultsClient'

export const dynamic = 'force-dynamic'

export default async function AdminResultsPage() {
  const [
    { data: marksheets, error: pendingError },
    { data: modRequests, error: modError }
  ] = await Promise.all([
    fetchPendingResults(),
    fetchModificationRequests()
  ])
  
  const error = pendingError || modError

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-emerald-400" />
            Result Approval
          </h1>
          <p className="text-mist mt-1 text-sm">
            Review teacher-uploaded results, preview the marksheet, and approve for student/parent access.
          </p>
        </div>

        {(marksheets.length > 0 || modRequests.length > 0) && (
          <span className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-sm font-semibold self-start">
            {marksheets.length + modRequests.length} pending approval
          </span>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!error && marksheets.length === 0 && modRequests.length === 0 && (
        <div className="glass rounded-2xl p-16 flex flex-col items-center gap-4 text-center">
          <ClipboardCheck className="w-16 h-16 text-emerald-500/40" />
          <h2 className="text-xl font-bold text-white">All Clear!</h2>
          <p className="text-mist text-sm max-w-xs">
            No pending results or edit requests at the moment. All uploaded results have been approved.
          </p>
        </div>
      )}

      {/* ── Results list ── */}
      {(marksheets.length > 0 || modRequests.length > 0) && <ResultsClient marksheets={marksheets} modRequests={modRequests as any} />}
    </div>
  )
}
