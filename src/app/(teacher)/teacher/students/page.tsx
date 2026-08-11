import { getTeacherClasses } from '@/actions/result-actions'
import TeacherStudentsClient from './TeacherStudentsClient'

export const dynamic = 'force-dynamic'

export default async function TeacherStudentsPage() {
  // Deduplicate teacher classes
  const classesRes = await getTeacherClasses()
  const uniqueClasses = Array.from(
    new Map((classesRes.data || []).map(c => [c.classId, c])).values()
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Students</h1>
        <p className="text-mist">View and manage students in your assigned classes.</p>
      </div>
      
      <TeacherStudentsClient classes={uniqueClasses} />
    </div>
  )
}
