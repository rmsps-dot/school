'use client'

import { useState } from 'react'
import {
  Search, Printer, User, BookOpen, Calendar, TrendingUp, Award,
  ChevronDown, ChevronUp, CheckCircle2, Eye,
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import type { StudentMarksheet } from '@/actions/admin-result-actions'
import MarksheetTemplate from '@/components/admin/MarksheetTemplate'
import MarksheetModal from '@/components/admin/MarksheetModal'
import PrintPortal from '@/components/admin/PrintPortal'

interface Props {
  marksheets: StudentMarksheet[]
}

const EXAM_LABELS: Record<string, string> = {
  unit_test:   'Unit Test',
  unit_test_2: 'Unit Test 2',
  monthly_test:'Monthly Test',
  mid_term:    'Mid-Term Exam',
  pre_board:   'Pre-Board Exam',
  final:       'Final Exam',
  other:       'Examination',
  other_exam:  'Examination',
}

const EXAM_COLORS: Record<string, string> = {
  unit_test:    'text-sky-300 border-sky-500/30',
  unit_test_2:  'text-sky-300 border-sky-500/30',
  monthly_test: 'text-violet-300 border-violet-500/30',
  mid_term:     'text-veena-blue border-veena-blue/30',
  pre_board:    'text-gold border-gold/30',
  final:        'text-coral border-coral/30',
  other:        'text-mist border-hairline',
  other_exam:   'text-mist border-hairline',
}

export default function ManageResultsClient({ marksheets }: Props) {
  const [search, setSearch]         = useState('')
  const [filterExam, setFilterExam] = useState('all')
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())
  const [printSheet, setPrintSheet] = useState<StudentMarksheet | null>(null)
  const [previewSheet, setPreviewSheet] = useState<StudentMarksheet | null>(null)

  const examTypes = Array.from(new Set(marksheets.map((s) => s.examType)))

  const filtered = marksheets.filter((s) => {
    const matchSearch =
      search === '' ||
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      s.className.toLowerCase().includes(search.toLowerCase())
    const matchExam = filterExam === 'all' || s.examType === filterExam
    return matchSearch && matchExam
  })

  // Group by class
  const byClass = new Map<string, typeof filtered>()
  for (const s of filtered) {
    const key = `${s.className} — Section ${s.section}`
    if (!byClass.has(key)) byClass.set(key, [])
    byClass.get(key)!.push(s)
  }

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function handleGeneratePDF(sheet: typeof filtered[number]) {
    setPrintSheet(sheet)
    // Wait for DOM to render the print area, then print
    setTimeout(() => {
      window.print()
      // After print dialog closes, clear state
      setTimeout(() => setPrintSheet(null), 500)
    }, 150)
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, ID, class..."
            className="input-glass rounded-xl pl-10 pr-4 py-2.5 text-sm w-full text-parchment placeholder-mist/40 focus:outline-none focus:border-coral/60 transition-all"
          />
        </div>
        <select
          value={filterExam}
          onChange={(e) => setFilterExam(e.target.value)}
          className="input-glass rounded-xl px-4 py-2.5 text-sm text-parchment appearance-none cursor-pointer min-w-[180px] focus:outline-none focus:border-coral/60 transition-all"
        >
          <option value="all" className="bg-ink">All Exam Types</option>
          {examTypes.map((t) => (
            <option key={t} value={t} className="bg-ink">{EXAM_LABELS[t] ?? t}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="surface-card border border-hairline rounded-xl p-8 text-center text-mist text-sm">
          No approved results match your filter.
        </div>
      )}

      {/* Class groups */}
      <div className="space-y-5">
        {Array.from(byClass.entries()).map(([classLabel, classSheets]) => {
          const isOpen = expanded.has(classLabel)
          return (
            <div key={classLabel} className="surface-card rounded-2xl overflow-hidden border border-hairline">
              <button
                onClick={() => toggleExpand(classLabel)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-veena-blue/30"
                    style={{ background: 'rgba(62,92,118,0.15)' }}>
                    <BookOpen className="w-5 h-5 text-veena-blue" />
                  </div>
                  <div className="text-left">
                    <p className="text-parchment font-bold text-sm">{classLabel}</p>
                    <p className="text-mist text-xs">{classSheets.length} result{classSheets.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-emerald-500/30"
                    style={{ background: 'rgba(16,185,129,0.08)' }}>
                    {classSheets.length} approved
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-mist" /> : <ChevronDown className="w-4 h-4 text-mist" />}
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-hairline border-t border-hairline">
                  {classSheets.map((s) => {
                    const isPassed   = s.percentage >= 33
                    const examColor  = EXAM_COLORS[s.examType] ?? EXAM_COLORS.other
                    const examLabel  = EXAM_LABELS[s.examType] ?? s.examType

                    return (
                      <div
                        key={`${s.studentRowId}__${s.examType}`}
                        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/[0.01] transition-colors"
                      >
                        {/* Student info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0 border border-emerald-500/30"
                            style={{ background: 'rgba(16,185,129,0.1)' }}>
                            {s.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-parchment font-semibold text-sm truncate">{s.studentName}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              <span className="text-xs text-mist flex items-center gap-1">
                                <User className="w-3 h-3" />{s.studentCode}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${examColor}`}
                                style={{ background: 'rgba(255,255,255,0.03)' }}>
                                {examLabel}
                              </span>
                              {s.approvedAt && (
                                <span className="text-xs text-mist flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  {new Date(s.approvedAt).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-1.5 text-xs">
                            <TrendingUp className="w-3.5 h-3.5 text-coral" />
                            <span className="text-parchment font-semibold font-mono">{s.totalObtained}/{s.grandTotal}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-mist" />
                            <span className="text-parchment font-semibold font-mono">{s.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Award className="w-3.5 h-3.5 text-gold" />
                            <span className="text-parchment font-bold">{s.grade}</span>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isPassed ? 'text-emerald-400 border-emerald-500/25' : 'text-red-400 border-red-500/25'}`}
                            style={{ background: isPassed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
                            {isPassed ? '✓ PASS' : '✗ FAIL'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewSheet(s)}
                            className="flex items-center justify-center w-8 h-8 rounded-xl text-mist hover:text-veena-blue hover:bg-veena-blue/10 transition-all border border-transparent hover:border-veena-blue/20"
                            title="Preview Marksheet"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleGeneratePDF(s)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all text-ink hover:scale-[1.02]"
                            style={{ background: 'var(--veena-blue, #4e7cf6)' }}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Generate PDF
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Hidden print area — rendered outside any modal so it prints correctly */}
      {printSheet && (
        <PrintPortal>
          <MarksheetTemplate
            sheet={printSheet}
            approvedAt={printSheet.approvedAt ?? new Date().toISOString()}
            printId="marksheet-print-portal"
          />
        </PrintPortal>
      )}

      {/* Preview modal */}
      <AnimatePresence>
        {previewSheet && (
          <MarksheetModal
            sheet={previewSheet}
            onClose={() => setPreviewSheet(null)}
            readOnly={true}
          />
        )}
      </AnimatePresence>
    </>
  )
}

