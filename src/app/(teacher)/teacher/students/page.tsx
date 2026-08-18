import { getTeacherClasses } from '@/actions/result-actions'
import { getClassTeacherPendingRequests } from '@/actions/profile-request-actions'
import TeacherStudentsClient from './TeacherStudentsClient'

export const dynamic = 'force-dynamic'

export default async function TeacherStudentsPage() {
  // Deduplicate teacher classes & fetch pending profile requests
  const [classesRes, requestsRes] = await Promise.all([
    getTeacherClasses(),
    getClassTeacherPendingRequests(),
  ])

  const uniqueClasses = Array.from(
    new Map((classesRes.data || []).map((c) => [c.classId, c])).values()
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Students & Approvals</h1>
        <p className="text-mist">View student records, inspect 3D ID cards, and review profile update requests.</p>
      </div>

      <TeacherStudentsClient
        classes={uniqueClasses}
        initialPendingRequests={requestsRes.data || []}
      />
    </div>
  )
}
