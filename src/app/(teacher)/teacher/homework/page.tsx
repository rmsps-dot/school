import { BookOpen } from 'lucide-react'
import { fetchTeacherClasses, fetchRecentHomework } from '@/actions/homework-actions'
import TeacherHomeworkClient from './TeacherHomeworkClient'

export const dynamic = 'force-dynamic'

export default async function TeacherHomeworkPage() {
  const [{ data: classes, error: classErr }, { data: recent, error: recentErr }] = await Promise.all([
    fetchTeacherClasses(),
    fetchRecentHomework()
  ])

  const error = classErr || recentErr

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-violet-400" /> Daily Homework
        </h1>
        <p className="text-mist mt-2 text-sm max-w-xl">
          Assign homework to your classes and track what you've assigned over the past 7 days.
        </p>
      </div>

      {error ? (
        <div className="glass rounded-xl p-6 border border-red-500/30 text-red-400 font-medium">
          Error loading data: {error}
        </div>
      ) : (
        <TeacherHomeworkClient classes={classes} recentHomework={recent} />
      )}
    </div>
  )
}
