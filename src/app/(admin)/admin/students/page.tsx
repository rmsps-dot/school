import { getAllStudents } from '@/actions/user-management-actions'
import { getClasses } from '@/actions/class-actions'
import ManageStudentsClient from './ManageStudentsClient'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ManageStudentsPage() {
  const [studentsRes, classesRes] = await Promise.all([
    getAllStudents(),
    getClasses()
  ])

  if (studentsRes.error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{studentsRes.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ManageStudentsClient 
        students={studentsRes.data || []} 
        classes={classesRes.data || []} 
      />
    </div>
  )
}
