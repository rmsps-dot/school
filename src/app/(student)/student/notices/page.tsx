import { Bell } from 'lucide-react'
import { fetchNotices } from '@/actions/notice-actions'
import NoticeBoard from '@/components/shared/NoticeBoard'

export const dynamic = 'force-dynamic'

export default async function StudentNoticesPage() {
  const { data: notices, error } = await fetchNotices()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="surface-card border-hairline rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner flex-shrink-0">
          <Bell className="w-8 h-8 text-veena-blue" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment">
            Notices
          </h1>
          <p className="text-mist mt-2 text-sm max-w-md">
            Important school announcements and circulars.
          </p>
        </div>
      </div>

      {error ? (
        <div className="surface-card border-hairline rounded-2xl p-6 text-red-400 text-sm font-mono shadow-xl border-red-500/30">
          {error}
        </div>
      ) : (
        <NoticeBoard notices={notices} roleName="student" />
      )}
    </div>
  )
}
