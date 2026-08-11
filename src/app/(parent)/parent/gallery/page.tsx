import { ImageIcon } from 'lucide-react'
import { fetchGalleryItems } from '@/actions/gallery-actions'
import GalleryViewer from '@/components/shared/GalleryViewer'

export const dynamic = 'force-dynamic'

export default async function ParentGalleryPage() {
  const { data: items, error } = await fetchGalleryItems()

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ImageIcon className="w-7 h-7 text-emerald-400" /> School Gallery
        </h1>
        <p className="text-mist text-sm mt-1">Explore campus events, sports, and memories.</p>
      </div>

      {error ? (
        <div className="glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm">{error}</div>
      ) : (
        <GalleryViewer items={items} />
      )}
    </div>
  )
}
