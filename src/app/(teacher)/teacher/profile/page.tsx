import { getTeacherProfile } from '@/actions/teacher-actions'
import TeacherProfileClient from './TeacherProfileClient'

export const dynamic = 'force-dynamic'

export default async function TeacherProfilePage() {
  const { data: teacher } = await getTeacherProfile()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Digital ID</h1>
        <p className="text-mist">View your teacher profile and digital identity card.</p>
      </div>
      
      {teacher ? (
        <TeacherProfileClient teacher={teacher} />
      ) : (
        <div className="glass p-8 rounded-2xl text-center border border-red-500/20">
          <p className="text-red-400">Could not load profile. Please contact admin.</p>
        </div>
      )}
    </div>
  )
}
