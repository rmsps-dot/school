import { Megaphone } from 'lucide-react'
import { fetchNotices } from '@/actions/notice-actions'
import AdminNoticesClient from './AdminNoticesClient'

export const dynamic = 'force-dynamic'

export default async function AdminNoticesPage() {
  const { data: notices, error } = await fetchNotices()

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-coral" /> Notice Board
        </h1>
        <p className="text-mist mt-2 text-sm max-w-xl">
          Publish global announcements or send targeted circulars to teachers, students, or parents.
        </p>
      </div>

      {error ? (
        <div className="glass rounded-xl p-6 border border-red-500/30 text-red-400 font-medium">
          Error loading notices: {error}
        </div>
      ) : (
        <AdminNoticesClient initialNotices={notices} />
      )}
    </div>
  )
}
