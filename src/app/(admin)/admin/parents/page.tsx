import { getAllParents, getAllStudents } from '@/actions/user-management-actions'
import ManageParentsClient from './ManageParentsClient'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ManageParentsPage() {
  const [parentsRes, studentsRes] = await Promise.all([
    getAllParents(),
    getAllStudents()
  ])

  if (parentsRes.error || studentsRes.error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{parentsRes.error || studentsRes.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ManageParentsClient 
        parents={parentsRes.data || []} 
        students={studentsRes.data || []} 
      />
    </div>
  )
}
