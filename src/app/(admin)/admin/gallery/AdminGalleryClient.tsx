'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Cropper from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  X,
  Check,
  Crop,
  Layers,
  ZoomIn,
  Eye,
  Calendar,
  AlertCircle,
  Maximize2,
  Sparkles,
} from 'lucide-react'
import { deleteGalleryItem, type GalleryItem, type GalleryCategory } from '@/actions/gallery-actions'

interface Props {
  initialItems: GalleryItem[]
}

const CATEGORIES: ('All' | GalleryCategory)[] = ['All', 'Event', 'Sports', 'Campus', 'Other']

// Allowed hostnames for Next/Image
const ALLOWED_HOSTNAMES = ['images.unsplash.com', 'i.ibb.co', 'i.postimg.cc']
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false
  try {
    const parsed = new URL(url)
    if (parsed.hostname.endsWith('.supabase.co')) return true
    return ALLOWED_HOSTNAMES.includes(parsed.hostname)
  } catch {
    return false
  }
}

// Canvas helper to crop image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.94)
  })
}

export default function AdminGalleryClient({ initialItems }: Props) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems)
  const [selectedCategory, setSelectedCategory] = useState<'All' | GalleryCategory>('All')
  const [isDeleting, startDeleteTransition] = useTransition()
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<GalleryItem | null>(null)

  // Form & Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GalleryCategory>('Event')
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  // Cropper Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(16 / 9)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number; height: number; x: number; y: number } | null>(null)
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined')

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadError('')
      setUploadSuccess('')
      const file = e.target.files[0]

      if (file.size > 32 * 1024 * 1024) {
        setUploadError('Image size is too large (max 32MB).')
        return
      }

      setOriginalFile(file)
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        const res = reader.result?.toString() || null
        setRawImageSrc(res)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setIsCropModalOpen(true)
      })
      reader.readAsDataURL(file)
    }
  }

  // ── ACTION: Use 100% Original Photo Without Any Cropping ──
  const handleUseOriginalFullImage = () => {
    if (!originalFile) return
    setCroppedImageBlob(originalFile)
    const previewUrl = URL.createObjectURL(originalFile)
    setCroppedPreviewUrl(previewUrl)
    setIsCropModalOpen(false)
  }

  // ── ACTION: Apply Custom Crop ──
  const handleApplyCrop = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return

    try {
      const croppedBlob = await getCroppedImg(rawImageSrc, croppedAreaPixels)
      if (!croppedBlob) throw new Error('Could not crop image')

      setCroppedImageBlob(croppedBlob)
      const previewUrl = URL.createObjectURL(croppedBlob)
      setCroppedPreviewUrl(previewUrl)
      setIsCropModalOpen(false)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error cropping image')
    }
  }

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!croppedImageBlob) {
      setUploadError('Please select a photo first.')
      return
    }
    if (!title.trim()) {
      setUploadError('Please enter a title for the photo.')
      return
    }

    setUploadError('')
    setUploadSuccess('')
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', croppedImageBlob, 'gallery-photo.jpg')
      formData.append('title', title.trim())
      formData.append('category', category)

      const res = await fetch('/api/upload-gallery', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload photo')
      }

      // Add to local state
      if (data.item) {
        setItems([data.item, ...items])
      }

      setUploadSuccess('Photo uploaded to school gallery successfully!')
      // Reset form
      setTitle('')
      setCategory('Event')
      setOriginalFile(null)
      setRawImageSrc(null)
      setCroppedImageBlob(null)
      setCroppedPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      setTimeout(() => setUploadSuccess(''), 4000)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Delete handler
  const handleDeleteItem = (id: string) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return

    startDeleteTransition(async () => {
      const res = await deleteGalleryItem(id)
      if (!res.success) {
        alert(res.error || 'Failed to delete item.')
      } else {
        setItems(items.filter((item) => item.id !== id))
        if (selectedLightboxImage?.id === id) setSelectedLightboxImage(null)
      }
    })
  }

  const filteredItems =
    selectedCategory === 'All' ? items : items.filter((item) => item.category === selectedCategory)

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* ── 1. Upload Section Card ── */}
      <div className="surface-card rounded-3xl p-6 md:p-8 border border-hairline shadow-2xl overflow-hidden relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-coral/10 border border-coral/30 flex items-center justify-center text-coral flex-shrink-0">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-parchment font-display">Upload Gallery Photo</h2>
            <p className="text-xs md:text-sm text-mist">
              Select any photo from your phone or PC. Post in full original size or crop as desired.
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Photo Drop / Select & Crop Preview */}
            <div className="lg:col-span-5 space-y-3">
              <label className="text-xs font-semibold text-mist uppercase tracking-wider block">
                Photo Selection
              </label>

              {croppedPreviewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-hairline bg-ink aspect-video group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={croppedPreviewUrl}
                    alt="Ready to Upload"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-coral text-ink font-bold text-xs flex items-center gap-1.5 shadow-lg hover:bg-coral/90 transition-all"
                    >
                      <Crop className="w-3.5 h-3.5" /> Adjust Crop
                    </button>
                    <button
                      type="button"
                      onClick={handleUseOriginalFullImage}
                      className="px-3.5 py-2 rounded-xl bg-veena-blue text-ink font-bold text-xs flex items-center gap-1.5 shadow-lg hover:bg-veena-blue/90 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Use Original
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-white/10 text-parchment font-bold text-xs flex items-center gap-1.5 border border-hairline hover:bg-white/20 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" /> Change
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-hairline hover:border-coral/60 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-ink/40 hover:bg-coral/5 aspect-video"
                >
                  <div className="w-14 h-14 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mb-3">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-parchment">
                    Click to Choose Photo from Device
                  </p>
                  <p className="text-[11px] text-mist mt-1 font-mono">
                    JPG, PNG, or WEBP (Max 32MB)
                  </p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
              />
            </div>

            {/* Right: Title, Category & Submit */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-mist uppercase tracking-wider">
                  Photo Title / Caption
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Meet 2026 Opening Ceremony"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-3 text-xs md:text-sm text-parchment focus:outline-none focus:border-coral transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-mist uppercase tracking-wider">
                  Gallery Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Event', 'Sports', 'Campus', 'Other'] as GalleryCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        category === cat
                          ? 'bg-coral text-ink font-bold border-coral shadow-md'
                          : 'bg-ink/50 border-hairline text-parchment hover:border-mist'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isUploading || !croppedImageBlob || !title.trim()}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-coral text-ink font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#E67E6B] transition-all disabled:opacity-50 shadow-lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading to CDN...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Publish to Gallery
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ── 2. Gallery Filter & Collection Grid ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-coral" />
            <h2 className="text-xl font-bold text-parchment font-display">Published Photos</h2>
            <span className="text-xs font-mono text-mist">({filteredItems.length} photos)</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-veena-blue text-ink font-bold shadow-md'
                    : 'bg-ink border border-hairline text-mist hover:text-parchment hover:border-mist'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="surface-card rounded-3xl p-12 text-center border border-hairline space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 text-mist flex items-center justify-center mx-auto">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-parchment">No Photos Found</h3>
            <p className="text-xs text-mist font-mono max-w-sm mx-auto">
              {selectedCategory === 'All'
                ? 'No photos have been uploaded to the school gallery yet.'
                : `No photos uploaded under category "${selectedCategory}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface-card rounded-2xl border border-hairline overflow-hidden shadow-xl group hover:border-coral/40 transition-all flex flex-col justify-between"
              >
                {/* Photo View Container */}
                <div
                  className="relative aspect-video bg-ink overflow-hidden cursor-pointer"
                  onClick={() => setSelectedLightboxImage(item)}
                >
                  {isValidImageUrl(item.media_url) ? (
                    <Image
                      src={item.media_url}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Category Pill Tag */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-ink/80 backdrop-blur-md text-coral border border-hairline">
                    {item.category}
                  </span>

                  {/* Hover Overlay Zoom */}
                  <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-parchment">
                    <div className="p-3 rounded-full bg-ink/80 backdrop-blur-sm border border-hairline">
                      <ZoomIn className="w-5 h-5 text-coral" />
                    </div>
                  </div>
                </div>

                {/* Card Bottom Details */}
                <div className="p-4 flex items-center justify-between gap-3 border-t border-hairline bg-surface/50">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-parchment truncate" title={item.title}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-mist font-mono mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(item.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedLightboxImage(item)}
                      className="p-2 rounded-xl bg-ink/60 hover:bg-white/10 text-mist hover:text-parchment border border-hairline transition-colors"
                      title="View Fullscreen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CROP PHOTO MODAL (FLEXIBLE LAYOUT + USE ORIGINAL BYPASS)
      ───────────────────────────────────────────────────────────── */}
      {mounted &&
        rawImageSrc &&
        isCropModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card w-full max-w-3xl rounded-3xl border border-hairline overflow-hidden shadow-2xl flex flex-col bg-ink text-parchment max-h-[95vh]"
            >
              {/* Header */}
              <div className="p-4 md:p-5 border-b border-hairline flex items-center justify-between bg-ink/90">
                <div className="flex items-center gap-2">
                  <Crop className="w-5 h-5 text-coral" />
                  <h3 className="font-display font-bold text-base md:text-lg text-parchment">
                    Crop Photo
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {/* One-click Original Bypass in header */}
                  <button
                    type="button"
                    onClick={handleUseOriginalFullImage}
                    className="px-3.5 py-1.5 rounded-xl bg-veena-blue/20 hover:bg-veena-blue text-parchment hover:text-ink border border-veena-blue/40 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Use Original (No Crop)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCropModalOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/10 text-mist hover:text-parchment transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Cropper Canvas */}
              <div className="relative h-[360px] md:h-[440px] w-full bg-black">
                <Cropper
                  image={rawImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  showGrid={true}
                  restrictPosition={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                />
              </div>

              {/* Controls Footer */}
              <div className="p-5 border-t border-hairline bg-surface space-y-4">
                {/* Zoom Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-mist uppercase tracking-wider">Zoom:</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-coral cursor-pointer"
                  />
                  <span className="text-xs font-mono text-coral font-bold">{zoom.toFixed(1)}x</span>
                </div>

                {/* Aspect Ratio Presets & Actions */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-mist font-semibold">Aspect Ratio:</span>
                    
                    {/* Free / Original Full button */}
                    <button
                      type="button"
                      onClick={handleUseOriginalFullImage}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all bg-veena-blue text-ink shadow-md flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Free (Original Full)
                    </button>

                    {[
                      { label: '16:9 (Landscape)', val: 16 / 9 },
                      { label: '4:3 (Standard)', val: 4 / 3 },
                      { label: '1:1 (Square)', val: 1 },
                      { label: '3:4 (Portrait)', val: 3 / 4 },
                    ].map((ar) => (
                      <button
                        key={ar.label}
                        type="button"
                        onClick={() => setAspectRatio(ar.val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                          aspectRatio === ar.val
                            ? 'bg-coral text-ink font-bold shadow-md'
                            : 'bg-ink border border-hairline text-parchment hover:border-mist'
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-ink border border-hairline text-mist hover:text-parchment text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCrop}
                      className="px-5 py-2 rounded-xl bg-coral text-ink text-xs font-bold hover:bg-coral/90 transition-all flex items-center gap-1.5 shadow-lg"
                    >
                      <Check className="w-4 h-4" />
                      Apply Crop
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {/* ─────────────────────────────────────────────────────────────
          LIGHTBOX MODAL (FULLSCREEN HIGH-RES VIEW)
      ───────────────────────────────────────────────────────────── */}
      {selectedLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-ink/80 text-parchment hover:text-coral border border-hairline transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Lightbox Image */}
            <div className="relative w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl border border-hairline shadow-2xl bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedLightboxImage.media_url}
                alt={selectedLightboxImage.title}
                className="max-w-full max-h-[75vh] object-contain"
              />
            </div>

            {/* Bottom Caption */}
            <div className="w-full mt-4 p-4 rounded-2xl bg-ink/90 border border-hairline flex items-center justify-between text-parchment shadow-xl">
              <div>
                <h3 className="font-display font-bold text-base md:text-lg">
                  {selectedLightboxImage.title}
                </h3>
                <p className="text-xs text-mist font-mono mt-0.5">
                  Category: <strong className="text-coral">{selectedLightboxImage.category}</strong> · Added on{' '}
                  {new Date(selectedLightboxImage.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteItem(selectedLightboxImage.id)}
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors flex items-center gap-1.5 text-xs font-bold"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
