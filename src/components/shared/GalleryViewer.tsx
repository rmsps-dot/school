'use client'

import { useState } from 'react'
import { Image as ImageIcon, Film, PlayCircle, Calendar, ImageOff, X } from 'lucide-react'
import type { GalleryItem, GalleryCategory, GalleryMediaType } from '@/actions/gallery-actions'

interface Props {
  items: GalleryItem[]
}

const CATEGORIES: ('All' | GalleryCategory)[] = ['All', 'Event', 'Sports', 'Campus', 'Other']

export default function GalleryViewer({ items }: Props) {
  const [filterCategory, setFilterCategory] = useState<'All' | GalleryCategory>('All')
  const [filterType, setFilterType] = useState<'all' | GalleryMediaType>('all')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const filteredItems = items.filter(item => {
    const matchCategory = filterCategory === 'All' || item.category === filterCategory
    const matchType = filterType === 'all' || item.media_type === filterType
    return matchCategory && matchType
  })

  // Basic utility to extract YouTube video ID if someone pastes a standard YT link
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  return (
    <div className="space-y-8">
      {/* ── Filters ── */}
      <div className="surface-card border-hairline rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 items-center justify-between shadow-xl">
        <div className="flex gap-3 overflow-x-auto pb-2 max-w-full styled-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                filterCategory === cat
                  ? 'bg-veena-blue text-ink shadow-lg scale-105'
                  : 'bg-surface border border-hairline text-mist hover:text-veena-blue hover:border-veena-blue/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 shrink-0 bg-ink border border-hairline p-2 rounded-2xl shadow-inner">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
              filterType === 'all' ? 'bg-veena-blue text-ink' : 'text-mist hover:text-parchment'
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => setFilterType('photo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
              filterType === 'photo' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'text-mist hover:text-emerald-400'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Photos
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
              filterType === 'video' ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400' : 'text-mist hover:text-violet-400'
            }`}
          >
            <Film className="w-4 h-4" /> Videos
          </button>
        </div>
      </div>

      {/* ── Gallery Grid ── */}
      {filteredItems.length === 0 ? (
        <div className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center mb-6 shadow-inner">
            <ImageOff className="w-10 h-10 text-mist/50" />
          </div>
          <h3 className="font-display text-2xl font-bold text-parchment mb-2">No Media Found</h3>
          <p className="text-mist text-sm max-w-sm">
            Try adjusting your filters or check back later for new uploads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, i) => {
            const isVideo = item.media_type === 'video'
            const ytId = isVideo ? getYouTubeId(item.media_url) : null

            return (
              <div key={item.id} className="group relative surface-card border-hairline rounded-[2rem] overflow-hidden flex flex-col h-[320px] shadow-xl transition-transform hover:-translate-y-1" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Image / Video Wrapper */}
                <div className="relative w-full h-56 bg-ink shrink-0 overflow-hidden border-b border-hairline shadow-inner">
                  {isVideo ? (
                    ytId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                        title={item.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <a 
                        href={item.media_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center w-full h-full text-mist hover:text-veena-blue transition-colors bg-surface hover:bg-surface/50"
                      >
                        <PlayCircle className="w-16 h-16 mb-4 text-violet-400 drop-shadow-lg" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Watch External Video</span>
                      </a>
                    )
                  ) : (
                      <img
                        src={item.media_url}
                        alt={item.title}
                        onClick={() => setSelectedImage(item.media_url)}
                        className="w-full h-full object-contain cursor-pointer transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback image if URL is broken
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'
                        }}
                      />
                  )}
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-ink/80 backdrop-blur-md border border-hairline text-[10px] font-bold text-parchment uppercase tracking-widest shadow-lg">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-6 flex-1 flex flex-col justify-between bg-surface/50">
                  <h4 className="font-display text-lg font-bold text-parchment line-clamp-1" title={item.title}>
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between mt-4 text-[10px] font-mono text-mist uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      {isVideo ? <Film className="w-4 h-4 text-violet-400" /> : <ImageIcon className="w-4 h-4 text-emerald-400" />}
                      <span className="capitalize">{item.media_type}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Lightbox Modal ── */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-6 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 p-3 rounded-full bg-surface border border-hairline hover:bg-surface/50 text-mist hover:text-parchment transition-all shadow-xl"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Expanded view" 
            className="max-w-full max-h-[90vh] object-contain rounded-[2rem] shadow-2xl border border-hairline bg-ink"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
