import { getParentDetails } from '@/actions/admin-details-actions'
import { getAvailableStudentsForLinking } from '@/actions/admin-management-actions'
import ParentDetailClient from './ParentDetailClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const [{ data: parent, error }, { data: availableStudents }] = await Promise.all([
    getParentDetails(resolvedParams.id),
    getAvailableStudentsForLinking(),
  ])

  if (error || !parent) {
    redirect('/admin/parents')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ParentDetailClient parent={parent} availableStudents={availableStudents || []} />
    </div>
  )
}
