import { fetchRecentHomework } from '@/actions/homework-actions'
import AdminHomeworkClient from './AdminHomeworkClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminHomeworkPage() {
  const { data: recentHomework, error } = await fetchRecentHomework()

  if (error) {
    console.error('Failed to load homework history:', error)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">School Homework History</h1>
        <p className="text-mist">View all homework assigned across the school in the last 7 days.</p>
      </div>

      <AdminHomeworkClient initialHomework={recentHomework || []} />
    </div>
  )
}
