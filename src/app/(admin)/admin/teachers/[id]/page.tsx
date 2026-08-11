import { getTeacherDetails } from '@/actions/user-management-actions'
import TeacherDetailClient from './TeacherDetailClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { data: teacher, error } = await getTeacherDetails(resolvedParams.id)

  if (error || !teacher) {
    redirect('/admin/teachers')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <TeacherDetailClient teacher={teacher} />
    </div>
  )
}
