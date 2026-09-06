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
        className="relative w-full max-w-4xl my-6 bg-surface border border-hairline rounded-3xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-hairline bg-surface/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-parchment font-display">Fee Receipt Preview</h2>
              <p className="text-xs text-mist font-mono">
                {data.receiptNo} • {data.studentName} ({data.className})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold text-ink hover:bg-[#E5C17B] transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
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
              className="w-9 h-9 rounded-xl border border-hairline text-mist hover:text-parchment flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {downloadError}
          </div>
        )}

        {/* Scrollable Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-180px)] bg-ink/50">
          <FeeReceiptPreview data={data} />
        </div>
      </div>
    </div>
  )
}
