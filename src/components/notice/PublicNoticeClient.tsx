'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Printer, Share2, Check, ArrowLeft, LogIn, ExternalLink } from 'lucide-react'

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
          title: document.title || 'RMSPS Official Notice',
          text: 'Official Circular from Residential Maa Saraswati Public School (RMSPS)',
          url,
        })
        return
      } catch {
        // user cancelled or failed, fallback to copy
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
    <div className="print:hidden flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-hairline mt-8">
      {/* Left Back to Website */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-mist hover:text-parchment bg-white/[0.03] hover:bg-white/[0.06] border border-hairline transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>RMSPS Main Website</span>
      </Link>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-parchment bg-white/[0.04] hover:bg-white/[0.08] border border-hairline transition-all shadow-sm"
          title="Share Notice Link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-coral" />
              <span>Share Circular</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-parchment bg-white/[0.04] hover:bg-white/[0.08] border border-hairline transition-all shadow-sm"
          title="Print or Save as PDF"
        >
          <Printer className="w-3.5 h-3.5 text-gold" />
          <span>Print / Save PDF</span>
        </button>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-ink bg-coral hover:bg-coral/90 transition-all shadow-md shadow-coral/15"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Portal Login</span>
        </Link>
      </div>
    </div>
  )
}
