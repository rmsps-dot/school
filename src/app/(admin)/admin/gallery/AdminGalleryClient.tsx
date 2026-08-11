'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Image as ImageIcon, Loader2, PlayCircle, X } from 'lucide-react'
import { addGalleryItem, deleteGalleryItem } from '@/actions/gallery-actions'
import type { GalleryItem, GalleryCategory, GalleryMediaType } from '@/actions/gallery-actions'

interface Props {
  initialItems: GalleryItem[]
}

export default function AdminGalleryClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GalleryCategory>('Event')
  const [mediaType, setMediaType] = useState<GalleryMediaType>('photo')
  const [mediaUrl, setMediaUrl] = useState('')

  const resetForm = () => {
    setTitle('')
    setCategory('Event')
    setMediaType('photo')
    setMediaUrl('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const res = await addGalleryItem(title, category, mediaType, mediaUrl)
      if (!res.success) {
        setError(res.error || 'Failed to add media.')
      } else {
        resetForm()
        window.location.reload()
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    startTransition(async () => {
      const res = await deleteGalleryItem(id)
      if (!res.success) {
        alert(res.error || 'Failed to delete media.')
      } else {
        window.location.reload()
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Add Media Form ── */}
      <div className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Add New Media</h2>
            <p className="text-sm text-mist">Link external photos or videos to save storage.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-parchment ml-1">Title</label>
              <input
                required
                type="text"
                placeholder="e.g., Annual Sports Meet 2026"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-glass w-full"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-parchment ml-1">Category</label>
              <select
                required
                value={category}
                onChange={e => setCategory(e.target.value as GalleryCategory)}
                className="input-glass w-full appearance-none cursor-pointer"
              >
                <option value="Event" className="bg-ink">Event</option>
                <option value="Sports" className="bg-ink">Sports</option>
                <option value="Campus" className="bg-ink">Campus</option>
                <option value="Other" className="bg-ink">Other</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-parchment ml-1">Media Type</label>
              <select
                required
                value={mediaType}
                onChange={e => setMediaType(e.target.value as GalleryMediaType)}
                className="input-glass w-full appearance-none cursor-pointer"
              >
                <option value="photo" className="bg-ink">Photo</option>
                <option value="video" className="bg-ink">Video (e.g., YouTube)</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-parchment ml-1">Media URL</label>
              <input
                required
                type="url"
                placeholder="https://example.com/image.jpg or YouTube URL"
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                className="input-glass w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary py-2.5 px-6 rounded-xl flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Media
          </button>
        </form>
      </div>

      {/* ── Manage Media List ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white px-2">Manage Gallery</h3>
        
        {items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <ImageIcon className="w-12 h-12 text-mist mx-auto mb-3" />
            <p className="text-mist text-sm">No media added yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const isVideo = item.media_type === 'video'
              // Basic youtube ID extraction
              const ytMatch = item.media_url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
              const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null

              return (
                <div key={item.id} className="glass rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white line-clamp-1">{item.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-parchment shrink-0">
                      {item.category}
                    </span>
                  </div>
                  
                  {/* Thumbnail Preview */}
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-ink shrink-0 relative mt-1">
                    {isVideo ? (
                      ytId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full text-mist">
                          <PlayCircle className="w-8 h-8 mb-1" />
                          <span className="text-[10px] uppercase font-bold">Video Link</span>
                        </div>
                      )
                    ) : (
                      <img
                        src={item.media_url}
                        alt={item.title}
                        onClick={() => setSelectedImage(item.media_url)}
                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'
                        }}
                      />
                    )}
                  </div>
                  
                  <p className="text-[10px] font-medium text-mist break-all line-clamp-1 mt-1" title={item.media_url}>
                    {item.media_url}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-hairline flex justify-end">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox Modal ── */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Expanded view" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
