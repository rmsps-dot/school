import { getAllStudentFeeReceipts, getAllTeacherPayments } from '@/actions/receipt-actions'
import { getClasses } from '@/actions/class-actions'
import AdminReceiptsClient from './AdminReceiptsClient'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminReceiptsPage() {
  const [studentReceiptsRes, teacherPaymentsRes, classesRes] = await Promise.all([
    getAllStudentFeeReceipts(),
    getAllTeacherPayments(),
    getClasses(),
  ])

  const anyError = studentReceiptsRes.error || teacherPaymentsRes.error || classesRes.error

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {anyError && (
        <div className="surface-card border border-amber-500/30 bg-amber-500/10 text-amber-300 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs">
            Notice: Some records could not be fully loaded. ({anyError})
          </p>
        </div>
      )}

      <AdminReceiptsClient
        studentReceipts={studentReceiptsRes.data || []}
        teacherPayments={teacherPaymentsRes.data || []}
        classes={classesRes.data || []}
      />
    </div>
  )
}
