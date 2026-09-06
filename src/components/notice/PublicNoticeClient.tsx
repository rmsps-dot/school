'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Printer, Share2, Check, ArrowLeft } from 'lucide-react'

export function PublicNoticeClient() {
  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title || 'RMSPS Notice',
          text: 'Official Notice from RMSPS',
          url,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  return (
    <div className="print:hidden flex items-center justify-between gap-3 pt-5 border-t border-white/[0.08]">
      {/* Subtle school link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-mist hover:text-parchment transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>rmsps.vercel.app</span>
      </Link>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-parchment bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all shadow-sm"
          title="Share Notice"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-coral" />
              <span>Share</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-parchment bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all shadow-sm"
          title="Save as PDF or Print"
        >
          <Printer className="w-3.5 h-3.5 text-gold" />
          <span>Save PDF / Print</span>
        </button>
      </div>
    </div>
  )
}
