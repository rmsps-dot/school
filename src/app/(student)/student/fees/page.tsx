import { getStudentProfile } from '@/actions/portal-actions'
import { getStudentFees } from '@/actions/fee-actions'
import StudentFeesClient from './StudentFeesClient'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentFeesPage() {
  const { data: profile, error: profileErr } = await getStudentProfile()

  if (profileErr || !profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="surface-card border border-red-500/30 bg-red-500/10 text-red-400 p-6 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{profileErr || 'Unable to load student profile.'}</p>
        </div>
      </div>
    )
  }

  const { data: fees, error: feeErr } = await getStudentFees(profile.studentCode)

  return (
    <div className="max-w-5xl mx-auto">
      <StudentFeesClient
        profile={profile}
        initialFees={fees || []}
        error={feeErr}
      />
    </div>
  )
}
