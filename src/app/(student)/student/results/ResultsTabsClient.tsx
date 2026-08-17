'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ApprovedResult, StudentProfile } from '@/actions/portal-actions'
import { calcGrade } from '@/utils/helpers'
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import MarksheetModal from '@/components/admin/MarksheetModal'
import type { Database } from '@/types/supabase'
import type { StudentMarksheet } from '@/actions/admin-result-actions'
import { downloadMarksheetPDF } from '@/utils/download-marksheet-pdf'

interface ExamGroup {
  examType: Database['public']['Enums']['exam_type']
  label: string
  rows: ApprovedResult[]
}

interface Props {
  grouped: ExamGroup[]
  examTypes: Database['public']['Enums']['exam_type'][]
  profile: StudentProfile
}

function gradeColor(pct: number) {
  if (pct >= 75) return 'text-emerald-400'
  if (pct >= 50) return 'text-amber-400'
  if (pct >= 33) return 'text-orange-400'
  return 'text-red-400'
}

export default function ResultsTabsClient({ grouped, profile }: Props) {
  const [active, setActive] = useState(0)
  const [previewSheet, setPreviewSheet] = useState<StudentMarksheet | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownloadPDF() {
    const sheet = buildMarksheet()
    setIsDownloading(true)
    try {
      await downloadMarksheetPDF(sheet)
    } catch (err) {
      console.error('PDF Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  if (grouped.length === 0) return null
  
  const current = grouped[active]

  const totalObt = current.rows.reduce((s, r) => s + r.marks_obtained, 0)
  const totalMax = current.rows.reduce((s, r) => s + r.total_marks, 0)
  const pct      = totalMax > 0 ? (totalObt / totalMax) * 100 : 0
  
  function buildMarksheet(): StudentMarksheet {
    return {
      studentRowId: profile.studentRowId,
      studentCode: profile.studentCode,
      studentName: profile.fullName,
      fatherName: profile.fatherName,
      motherName: profile.motherName,
      dob: profile.dob,
      address: profile.address,
      classId: 'N/A',
      className: current.rows[0].class_name,
      section: current.rows[0].section,
      examType: current.examType,
      teacherName: 'School Admin',
      subjects: current.rows.map(r => ({
        id: r.id,
        subject: r.subject,
        marksObtained: r.marks_obtained,
        totalMarks: r.total_marks,
        passingMarks: Math.ceil(r.total_marks * 0.33)
      })),
      totalObtained: totalObt,
      grandTotal: totalMax,
      percentage: pct,
      grade: calcGrade(pct)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-3 flex-wrap">
        {grouped.map((g, i) => (
          <button
            key={g.examType}
            id={`result-tab-${g.examType}`}
            onClick={() => setActive(i)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              active === i
                ? 'bg-veena-blue text-ink shadow-lg scale-105'
                : 'bg-surface border border-hairline text-mist hover:text-veena-blue hover:border-veena-blue/50'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="surface-card border-hairline rounded-[2rem] overflow-hidden shadow-2xl"
        >
          {/* Action Header */}
          <div className="flex items-center justify-between px-8 py-4 bg-surface border-b border-hairline">
            <h3 className="font-display font-bold text-parchment text-lg">{current.label}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setPreviewSheet(buildMarksheet())}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-mist hover:text-veena-blue hover:bg-veena-blue/10 transition-colors border border-transparent hover:border-veena-blue/30"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Preview
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-veena-blue bg-veena-blue/10 hover:bg-veena-blue/20 transition-colors border border-veena-blue/30 disabled:opacity-50"
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
            </div>
          </div>

          {/* ── Mobile Layout (Below sm: breakpoint) ── */}
          <div className="sm:hidden divide-y divide-hairline">
            {current.rows.map((r, i) => {
              const rowPct    = r.total_marks > 0 ? (r.marks_obtained / r.total_marks) * 100 : 0
              const rowGrade  = calcGrade(rowPct)
              const passMark  = Math.ceil(r.total_marks * 0.33)
              const passed    = r.marks_obtained >= passMark

              return (
                <div
                  key={r.id}
                  className="p-4 space-y-3"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-parchment">{r.subject}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${gradeColor(rowPct)}`}>{rowGrade}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        passed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-hairline/60 text-center">
                    <div className="p-2 rounded-xl bg-surface/50 border border-hairline/40">
                      <p className="text-[9px] font-mono text-mist uppercase tracking-wider">Obtained</p>
                      <p className="text-sm font-bold text-parchment font-mono mt-0.5">{r.marks_obtained}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-surface/50 border border-hairline/40">
                      <p className="text-[9px] font-mono text-mist uppercase tracking-wider">Max Marks</p>
                      <p className="text-sm font-bold text-mist font-mono mt-0.5">{r.total_marks}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-surface/50 border border-hairline/40">
                      <p className="text-[9px] font-mono text-mist uppercase tracking-wider">Pass Mark</p>
                      <p className="text-sm font-bold text-mist font-mono mt-0.5">{passMark}</p>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Mobile Footer */}
            <div className="p-4 bg-surface border-t border-hairline space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-mist font-mono uppercase tracking-wider">{current.rows.length} subjects</span>
                <span className="font-bold text-parchment font-display">Total: {totalObt} / {totalMax}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-hairline/50">
                <span className="text-mist">Overall Percentage</span>
                <span className={`font-bold font-display ${gradeColor(pct)}`}>{pct.toFixed(1)}% ({calcGrade(pct)})</span>
              </div>
            </div>
          </div>

          {/* ── Desktop Table Layout (sm: and up) ── */}
          <div className="hidden sm:block">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_70px_70px] gap-4 px-8 py-5 bg-surface border-b border-hairline text-[10px] font-bold text-veena-blue uppercase tracking-widest">
              <span>Subject</span>
              <span className="text-center">Max</span>
              <span className="text-center">Pass</span>
              <span className="text-center">Obtained</span>
              <span className="text-center">Grade</span>
              <span className="text-center">Status</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-hairline">
              {current.rows.map((r, i) => {
                const rowPct    = r.total_marks > 0 ? (r.marks_obtained / r.total_marks) * 100 : 0
                const rowGrade  = calcGrade(rowPct)
                const passMark  = Math.ceil(r.total_marks * 0.33)
                const passed    = r.marks_obtained >= passMark

                return (
                  <div
                    key={r.id}
                    className="ledger-row grid grid-cols-[1fr_80px_80px_80px_70px_70px] gap-4 px-8 py-5 items-center hover:bg-surface/50 transition-colors"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <p className="text-sm font-bold text-parchment">{r.subject}</p>
                    <p className="text-center text-[10px] font-mono text-mist">{r.total_marks}</p>
                    <p className="text-center text-[10px] font-mono text-mist">{passMark}</p>
                    <p className="text-center text-sm font-bold text-parchment drop-shadow-sm">{r.marks_obtained}</p>
                    <p className={`text-center text-sm font-bold drop-shadow-sm ${gradeColor(rowPct)}`}>{rowGrade}</p>
                    <div className="flex justify-center">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${
                        passed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer summary */}
            <div className="flex items-center justify-between px-8 py-6 bg-surface border-t border-hairline">
              <span className="text-[10px] font-mono text-mist uppercase tracking-widest">{current.rows.length} subjects</span>
              <div className="flex items-center gap-8 text-[10px] font-mono uppercase tracking-widest">
                <span className="text-mist">Total: <strong className="text-parchment text-sm ml-2 font-display">{totalObt}/{totalMax}</strong></span>
                <span className="text-mist">Percentage: <strong className={`${gradeColor(pct)} text-sm ml-2 font-display`}>{pct.toFixed(1)}%</strong></span>
                <span className="text-mist">Grade: <strong className={`${gradeColor(pct)} text-sm ml-2 font-display`}>{calcGrade(pct)}</strong></span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* PDF PREVIEW MODAL */}
      {previewSheet && (
        <MarksheetModal
          sheet={previewSheet}
          onClose={() => setPreviewSheet(null)}
          readOnly
        />
      )}
    </div>
  )
}
