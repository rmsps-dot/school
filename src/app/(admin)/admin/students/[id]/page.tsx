import { getStudentProfileData } from '@/actions/class-actions'
import StudentProfileClient from './StudentProfileClient'
import { AlertCircle, UserX } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data, error } = await getStudentProfileData(id)

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="glass rounded-2xl p-10 text-center">
          <UserX className="w-16 h-16 text-mist mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Student Not Found</h2>
          <p className="text-mist text-sm">
            {error || 'The requested student profile could not be found or you do not have permission to view it.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <StudentProfileClient data={data} />
    </div>
  )
}
