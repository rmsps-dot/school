'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { Camera, Upload, X, Loader2, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarUploadProps {
  currentPhotoUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  userId?: string; // Optional: if an admin is updating another user's profile
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// Helper to get pixel dimensions based on size prop
const getSizeClasses = (size: AvatarUploadProps['size']) => {
  switch (size) {
    case 'xs': return 'w-9 h-9';
    case 'sm': return 'w-12 h-12';
    case 'md': return 'w-16 h-16';
    case 'lg': return 'w-24 h-24';
    case 'xl': return 'w-32 h-32';
    default: return 'w-24 h-24'; // Default lg
  }
};

const getPixelSize = (size: AvatarUploadProps['size']) => {
  switch (size) {
    case 'xs': return 36;
    case 'sm': return 48;
    case 'md': return 64;
    case 'lg': return 96;
    case 'xl': return 128;
    default: return 96;
  }
};

// Allowed hostnames from next.config.ts
const ALLOWED_HOSTNAMES = [
  'images.unsplash.com',
  'i.ibb.co',
  'i.postimg.cc'
];

const isValidAvatarUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('.supabase.co')) return true;
    return ALLOWED_HOSTNAMES.includes(parsed.hostname);
  } catch (e) {
    return false;
  }
};

// --- Canvas helper to crop image ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

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
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}
// -----------------------------------

export default function AvatarUpload({ currentPhotoUrl, onUploadSuccess, userId, size = 'lg' }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Cropper State
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImageLoadError(false);
  }, [currentPhotoUrl]);

  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setError(null);
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        setError("File is too large. Maximum size is 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Failed to crop image");

      const formData = new FormData();
      formData.append('image', croppedBlob, 'avatar.jpg');
      if (userId) formData.append('userId', userId);

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload image');
      }

      setError(null);
      const data = await res.json();
      
      onUploadSuccess(data.url);
      
      // Reset state
      setImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: any) {
      setError(error.message || "Failed to update profile photo");
    } finally {
      setIsUploading(false);
    }
  };

  const sizeClasses = getSizeClasses(size);
  const pixelSize = getPixelSize(size);

  return (
    <>
      {/* ── Avatar Trigger ── */}
      <div 
        className={`relative rounded-2xl overflow-hidden border-2 border-hairline shadow-lg flex-shrink-0 group cursor-pointer ${sizeClasses}`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-mist">
            <Loader2 className="w-6 h-6 animate-spin mb-1 text-coral" />
            <span className="text-[10px] font-bold tracking-wider">UPLOADING</span>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
            <Camera className="w-8 h-8 text-white/90 drop-shadow-md" />
          </div>
        )}

        {currentPhotoUrl && isValidAvatarUrl(currentPhotoUrl) && !imageLoadError ? (
          <Image 
            src={currentPhotoUrl} 
            alt="Profile Photo" 
            fill 
            sizes={`${pixelSize}px`} 
            className="object-cover"
            onError={() => setImageLoadError(true)}
          />
        ) : (
          <div className="w-full h-full bg-veena-blue/10 flex items-center justify-center text-veena-blue/50">
            <UserCircle className="w-3/4 h-3/4" />
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/jpeg, image/png, image/webp" 
          className="hidden" 
        />
      </div>
      
      {error && !imageSrc && (
        <div className="text-red-500 text-xs mt-2 font-medium">{error}</div>
      )}

      {/* ── Crop Modal ── */}
      {mounted && typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {imageSrc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="surface-card w-full max-w-md rounded-2xl border border-hairline overflow-hidden shadow-2xl flex flex-col">
              <div className="p-4 border-b border-hairline flex items-center justify-between bg-ink/50">
                <h3 className="font-display font-bold text-parchment">Adjust Photo</h3>
                <button 
                  onClick={() => { setImageSrc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-mist hover:text-parchment transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative h-[350px] w-full bg-black">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="p-6 bg-ink/50 space-y-6">
                {error && (
                  <div className="text-red-500 text-xs font-medium text-center bg-red-500/10 py-2 rounded-lg">{error}</div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-mist font-medium">
                    <span>Zoom Out</span>
                    <span>Zoom In</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-coral h-1.5 bg-hairline rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setImageSrc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-mist hover:text-parchment hover:bg-white/5 transition-all border border-transparent hover:border-hairline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCrop}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-ink bg-coral hover:bg-coral/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isUploading ? 'Uploading...' : 'Set Photo'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      ) : null}
    </>
  );
}
