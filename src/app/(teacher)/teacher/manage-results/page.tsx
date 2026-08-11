import { getTeacherResults } from '@/actions/manage-results-actions'
import ManageResultsClient from './ManageResultsClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ManageResultsPage() {
  const res = await getTeacherResults()
  const error = res.error
  const results = 'data' in res ? res.data : null

  if (error || !results) {
    // You could render an error state or redirect
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Manage Uploaded Results</h1>
        <p className="text-mist">View, edit, or delete results you have uploaded. Approved results cannot be modified.</p>
      </div>

      <ManageResultsClient initialResults={results || []} />
    </div>
  )
}
