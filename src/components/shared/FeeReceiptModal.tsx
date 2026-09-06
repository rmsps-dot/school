'use client'

import { useState } from 'react'
import { X, Download, Loader2, IndianRupee } from 'lucide-react'
import type { FeeReceiptData } from '@/components/pdf/FeeReceiptPdf'
import FeeReceiptPreview from './FeeReceiptPreview'
import { downloadFeeReceiptPDF } from '@/utils/download-receipt-pdf'

interface Props {
  data: FeeReceiptData
  onClose: () => void
}

export default function FeeReceiptModal({ data, onClose }: Props) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  async function handleDownload() {
    setIsDownloading(true)
    setDownloadError('')
    try {
      const res = await downloadFeeReceiptPDF(data)
      if (!res.success) {
        setDownloadError(res.error || 'Failed to download PDF')
      }
    } catch (err) {
      console.error('Download receipt error:', err)
      setDownloadError('An unexpected error occurred while generating PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-ink/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-5xl my-4 sm:my-6 bg-surface border border-hairline rounded-2xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-4 p-3.5 sm:p-6 border-b border-hairline bg-surface/90 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-bold text-parchment font-display truncate">Fee Receipt Preview</h2>
              <p className="text-[11px] sm:text-xs text-mist font-mono truncate">
                {data.receiptNo} • {data.studentName} ({data.className})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold text-ink hover:bg-[#E5C17B] transition-colors cursor-pointer shadow-md disabled:opacity-50 flex-shrink-0"
              title="Download PDF"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Download <span className="hidden sm:inline">PDF</span></span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-hairline text-mist hover:text-parchment flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 bg-surface hover:bg-surface/80"
              title="Close Preview"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {downloadError}
          </div>
        )}

        {/* Scrollable Preview Container with Result Preview Style Sliding */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(100vh-180px)] bg-ink/50 flex-1">
          {/* Mobile swipe hint */}
          <div className="sm:hidden flex items-center justify-center gap-1.5 text-[11px] font-mono text-mist mb-3 bg-ink/70 py-1 px-3 rounded-lg border border-hairline w-max mx-auto">
            <span className="text-gold">⇄</span> Slide horizontally to view full receipt
          </div>

          <div
            className="rounded-2xl overflow-x-auto shadow-2xl border border-hairline bg-ink/30 p-2 sm:p-4"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="w-max min-w-full flex justify-center">
              <FeeReceiptPreview data={data} />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-5 border-t border-hairline bg-surface/90 backdrop-blur-md flex-shrink-0">
          <div className="text-[11px] font-mono text-mist hidden sm:block">
            Official RMSPS Fee Receipt • {data.receiptNo}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gold text-ink hover:bg-[#E5C17B] transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl surface-card text-xs sm:text-sm font-bold text-parchment hover:bg-surface border border-hairline transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
