'use client'

import { useState, useTransition } from 'react'
import { X, CheckCircle2, Loader2, AlertCircle, FileText, Download } from 'lucide-react'
import type { StudentMarksheet } from '@/actions/admin-result-actions'
import { approveStudentResults } from '@/actions/admin-result-actions'
import MarksheetPreview from './MarksheetPreview'
import { downloadMarksheetPDF } from '@/utils/download-marksheet-pdf'

interface Props {
  sheet: StudentMarksheet
  onClose: () => void
  onApproved?: () => void
  readOnly?: boolean
}

const EXAM_LABELS: Record<string, string> = {
  unit_test: 'Unit Test',
  mid_term:  'Mid-Term Exam',
  pre_board: 'Pre-Board Exam',
  final:     'Final Exam',
  other:     'Examination',
}

export default function MarksheetModal({ sheet, onClose, onApproved, readOnly }: Props) {
  const [error, setError]           = useState('')
  const [isPending, startTransition] = useTransition()
  const [isDownloading, setIsDownloading] = useState(false)

  /* ── Approve only (no auto-print) ── */
  function handleApprove() {
    if (readOnly) return
    startTransition(async () => {
      setError('')
      const result = await approveStudentResults(sheet.studentRowId, sheet.examType)

      if (!result.success) {
        setError(result.error ?? 'Approval failed. Please try again.')
        return
      }

      onApproved?.()
      onClose()
    })
  }

  async function handleDownload() {
    setIsDownloading(true)
    try {
      await downloadMarksheetPDF(sheet, sheet.approvedAt)
    } catch (err) {
      console.error('Download failed:', err)
      setError('Failed to download PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const examLabel = EXAM_LABELS[sheet.examType] ?? sheet.examType
  const isPassed  = sheet.percentage >= 33

  return (
    <>
      {/* ─────────────────────────────────────────────
          SCREEN-ONLY MODAL (hidden when printing)
      ───────────────────────────────────────────── */}
      <div
        className="marksheet-modal-overlay fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-ink/80 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          className="marksheet-modal-panel relative w-full max-w-5xl my-4 glass-panel border border-hairline rounded-2xl flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between p-6 border-b border-hairline flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-coral" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-parchment font-display">Marksheet Preview</h2>
                <p className="text-xs text-mist font-mono">
                  {sheet.studentName} — {examLabel} — {sheet.className} Sec {sheet.section}
                </p>
              </div>
            </div>
            <button
              id="marksheet-modal-close"
              onClick={onClose}
              disabled={isPending || isDownloading}
              className="w-8 h-8 rounded-lg text-mist hover:text-parchment transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Scrollable Preview Area ── */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Summary pill bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Student', value: sheet.studentCode, color: 'text-coral' },
                { label: 'Marks',   value: `${sheet.totalObtained}/${sheet.grandTotal}`, color: 'text-violet-400' },
                { label: 'Percentage', value: `${sheet.percentage.toFixed(1)}%`, color: 'text-cyan-400' },
                { label: 'Grade',   value: sheet.grade, color: isPassed ? 'text-emerald-400' : 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="surface-card rounded-xl p-3 text-center">
                  <p className="text-xs text-mist">{label}</p>
                  <p className={`text-lg font-bold mt-0.5 font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* White marksheet preview */}
            <div
              className="rounded-xl overflow-x-auto shadow-2xl border border-hairline"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="w-max min-w-full flex justify-center">
                <MarksheetPreview sheet={sheet} approvedAt={sheet.approvedAt} />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 border-t border-hairline flex-shrink-0">
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {!error && <div className="hidden sm:block" />}

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={isPending || isDownloading}
                className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 text-veena-blue bg-veena-blue/10 hover:bg-veena-blue/20 transition-colors border border-veena-blue/30 disabled:opacity-50"
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
                disabled={isPending || isDownloading}
                className="px-5 py-2.5 rounded-xl surface-card text-sm font-bold text-parchment disabled:opacity-50 transition-colors hover:text-parchment"
              >
                {readOnly ? 'Close' : 'Cancel'}
              </button>
              {!readOnly && (
                <button
                  id="approve-btn"
                  onClick={handleApprove}
                  disabled={isPending || isDownloading}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-ink transition-all"
                  style={{ background: 'var(--coral)' }}
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Approve</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
