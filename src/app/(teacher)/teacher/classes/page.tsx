import { BookOpen } from 'lucide-react'
import { getTeacherClasses } from '@/actions/result-actions'
import ClassesClient from './ClassesClient'

export const dynamic = 'force-dynamic'

export default async function TeacherClassesPage() {
  const { data: classes, error } = await getTeacherClasses()

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="surface-card border-hairline rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner flex-shrink-0">
          <BookOpen className="w-8 h-8 text-veena-blue" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment">
            My Classes
          </h1>
          <p className="text-mist mt-2 text-sm max-w-sm">
            Select a class from your assigned directory to upload student results.
          </p>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="surface-card border-hairline rounded-2xl p-6 border-red-500/30 text-red-400 text-sm font-mono shadow-xl">
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!error && classes.length === 0 && (
        <div className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-mist/50" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-parchment">No Classes Assigned</h2>
            <p className="text-mist text-sm max-w-md mt-2 mx-auto">
              You haven&apos;t been assigned to any class yet. Please contact the administrator to get
              classes assigned to your profile in the directory.
            </p>
          </div>
        </div>
      )}

      {/* ── Class cards ── */}
      {classes.length > 0 && <ClassesClient classes={classes} />}
    </div>
  )
}
