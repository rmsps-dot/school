import { Bell } from 'lucide-react'
import { fetchNotices } from '@/actions/notice-actions'
import NoticeBoard from '@/components/shared/NoticeBoard'

export const dynamic = 'force-dynamic'

export default async function TeacherNoticesPage() {
  const { data: notices, error } = await fetchNotices()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Bell className="w-7 h-7 text-violet-400" /> Notices & Circulars
        </h1>
        <p className="text-mist text-sm mt-1">Important school announcements for teachers.</p>
      </div>

      {error ? (
        <div className="glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm">{error}</div>
      ) : (
        <NoticeBoard notices={notices} roleName="teacher" />
      )}
    </div>
  )
}
