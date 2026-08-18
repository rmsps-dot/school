import { getAllTeachers } from '@/actions/user-management-actions'
import { getAllClassesList } from '@/actions/admin-management-actions'
import ManageTeachersClient from './ManageTeachersClient'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ManageTeachersPage() {
  const [{ data: teachers, error: teachersError }, { data: classes }] = await Promise.all([
    getAllTeachers(),
    getAllClassesList(),
  ])

  if (teachersError) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{teachersError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ManageTeachersClient teachers={teachers || []} classes={classes || []} />
    </div>
  )
}
