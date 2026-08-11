import { FileStack } from 'lucide-react'
import { fetchApprovedResults } from '@/actions/admin-result-actions'
import ManageResultsClient from './ManageResultsClient'

export const dynamic = 'force-dynamic'

export default async function ManageResultsPage() {
  const { data: marksheets, error } = await fetchApprovedResults()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <FileStack className="w-8 h-8 text-veena-blue" />
            Manage Results
          </h1>
          <p className="text-mist mt-1 text-sm">
            View all approved results, generate and print marksheets as PDF.
          </p>
        </div>
        {marksheets.length > 0 && (
          <span className="px-4 py-2 rounded-xl bg-veena-blue/15 border border-veena-blue/25 text-veena-blue text-sm font-semibold self-start">
            {marksheets.length} approved result{marksheets.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {!error && marksheets.length === 0 && (
        <div className="glass rounded-2xl p-16 flex flex-col items-center gap-4 text-center">
          <FileStack className="w-16 h-16 text-veena-blue/40" />
          <h2 className="text-xl font-bold text-white">No Approved Results Yet</h2>
          <p className="text-mist text-sm max-w-xs">
            Once you approve results from the Result Approval section, they will appear here.
          </p>
        </div>
      )}

      {marksheets.length > 0 && <ManageResultsClient marksheets={marksheets} />}
    </div>
  )
}

