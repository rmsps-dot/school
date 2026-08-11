import { ImageIcon } from 'lucide-react'
import { fetchGalleryItems } from '@/actions/gallery-actions'
import AdminGalleryClient from './AdminGalleryClient'

export const dynamic = 'force-dynamic'

export default async function AdminGalleryPage() {
  const { data: items, error } = await fetchGalleryItems()

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-emerald-400" /> School Gallery
        </h1>
        <p className="text-mist mt-2 text-sm max-w-xl">
          Manage the URL-based media gallery. Add external photo and video links to share with the school.
        </p>
      </div>

      {error ? (
        <div className="glass rounded-xl p-6 border border-red-500/30 text-red-400 font-medium">
          Error loading gallery: {error}
        </div>
      ) : (
        <AdminGalleryClient initialItems={items} />
      )}
    </div>
  )
}
