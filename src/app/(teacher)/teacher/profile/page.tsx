import { getTeacherProfile } from '@/actions/teacher-actions'
import { getUserPendingProfileRequest } from '@/actions/profile-request-actions'
import TeacherProfileClient from './TeacherProfileClient'

export const dynamic = 'force-dynamic'

export default async function TeacherProfilePage() {
  const [{ data: teacher }, { data: pendingRequest }] = await Promise.all([
    getTeacherProfile(),
    getUserPendingProfileRequest(),
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Digital ID & Profile</h1>
        <p className="text-mist">View your faculty profile, digital identity card, and manage update requests.</p>
      </div>

      {teacher ? (
        <TeacherProfileClient teacher={teacher} pendingRequest={pendingRequest} />
      ) : (
        <div className="glass p-8 rounded-2xl text-center border border-red-500/20">
          <p className="text-red-400">Could not load profile. Please contact admin.</p>
        </div>
      )}
    </div>
  )
}
