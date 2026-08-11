import { getAssignClassesData } from '@/actions/assign-classes-actions'
import AssignClassesClient from './AssignClassesClient'
import { BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AssignClassesPage() {
  const { teachers, classes, error } = await getAssignClassesData()

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="font-display text-3xl font-bold text-parchment flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-coral" />
          Assign Classes
        </h1>
        <div className="surface-card border-hairline p-8 rounded-2xl text-center border border-red-500/20 text-red-400">
          Failed to load data: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-parchment flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-coral" />
          Assign Classes
        </h1>
        <p className="text-mist mt-2 max-w-md text-sm">
          Select a teacher from the directory to assign or remove class access.
        </p>
      </div>

      <AssignClassesClient teachers={teachers || []} classes={classes || []} />
    </div>
  )
}
