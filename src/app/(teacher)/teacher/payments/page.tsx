import { getTeacherPaymentsForCurrentTeacher } from '@/actions/receipt-actions'
import TeacherPaymentsClient from './TeacherPaymentsClient'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeacherPaymentsPage() {
  const { data: payments, teacherInfo, error } = await getTeacherPaymentsForCurrentTeacher()

  if (error && !teacherInfo) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="surface-card border border-red-500/30 bg-red-500/10 text-red-400 p-6 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <TeacherPaymentsClient
        initialPayments={payments || []}
        teacherInfo={
          teacherInfo || {
            teacherId: '',
            teacherCode: 'TEA-RMSPS',
            teacherName: 'Faculty Member',
            qualification: 'Teaching Staff',
          }
        }
        error={error || undefined}
      />
    </div>
  )
}
