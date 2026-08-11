import { getClasses } from '@/actions/class-actions'
import ClassDashboardClient from './ClassDashboardClient'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ManageClassesPage() {
  const { data: classes, error } = await getClasses()

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ClassDashboardClient classes={classes ?? []} />
    </div>
  )
}
