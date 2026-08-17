import { useState, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, BookOpen, CalendarDays, Award, TrendingUp,
  CheckCircle2, XCircle, Clock, Minus, Loader2, FileSpreadsheet, Download,
} from 'lucide-react'
import MarksheetModal from '@/components/admin/MarksheetModal'
import type { StudentMarksheet } from '@/actions/admin-result-actions'
import type { ChildInfo, ApprovedResult, AttendanceSummary } from '@/actions/portal-actions'
import { getChildResults, getChildAttendance } from '@/actions/portal-actions'
import { calcGrade } from '@/utils/helpers'
import { downloadMarksheetPDF } from '@/utils/download-marksheet-pdf'

/* ── Sub-types ── */
type TabType = 'results' | 'attendance'

const EXAM_LABELS: Record<string, string> = {
  unit_test: 'Unit Test', mid_term: 'Mid-Term', pre_board: 'Pre-Board', final: 'Final', other: 'Other',
}

function gradeColor(pct: number) {
  if (pct >= 75) return 'text-emerald-400'
  if (pct >= 50) return 'text-amber-400'
  if (pct >= 33) return 'text-orange-400'
  return 'text-red-400'
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
    present:  { label: 'Present',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', Icon: CheckCircle2 },
    absent:   { label: 'Absent',   cls: 'bg-red-500/10    text-red-400    border-red-500/20',       Icon: XCircle     },
    late:     { label: 'Late',     cls: 'bg-amber-500/10  text-amber-400  border-amber-500/20',     Icon: Clock       },
    half_day: { label: 'Half Day', cls: 'bg-sky-500/10    text-sky-400    border-sky-500/20',       Icon: Minus       },
  }
  const cfg = map[status] ?? { label: status, cls: 'bg-surface border-hairline text-mist', Icon: Minus }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${cfg.cls}`}>
      <cfg.Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

function PctArc({ pct }: { pct: number }) {
  const r = 40, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(243,239,230,0.05)" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill={color}
        className="font-display font-bold text-xl drop-shadow">{pct}%</text>
    </svg>
  )
}

interface Props {
  children: ChildInfo[]
  defaultId?: string
}

export default function ProgressClient({ children, defaultId }: Props) {
  const firstId = defaultId && children.find(c => c.studentRowId === defaultId)
    ? defaultId
    : children[0]?.studentRowId ?? ''

  const [selectedId, setSelectedId] = useState(firstId)
  const [tab, setTab] = useState<TabType>('results')
  const [results, setResults]     = useState<ApprovedResult[] | null>(null)
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null)
  const [error, setError]         = useState('')
  const [examTab, setExamTab]     = useState(0)
  const [isPending, startTransition] = useTransition()
  
  const [previewSheet, setPreviewSheet] = useState<StudentMarksheet | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const selectedChild = children.find(c => c.studentRowId === selectedId)

  async function handleDownloadPDF(idx: number) {
    const sheet = buildMarksheet(idx)
    if (!sheet) return
    setIsDownloading(true)
    try {
      await downloadMarksheetPDF(sheet)
    } catch (err) {
      console.error('PDF Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  // Load data when child or tab changes
  useEffect(() => {
    if (!selectedId) return
    setError('')
    setResults(null)
    setAttendance(null)

    startTransition(async () => {
      if (tab === 'results') {
        const { data, error } = await getChildResults(selectedId)
        if (error) { setError(error); return }
        setResults(data)
        setExamTab(0)
      } else {
        const { data, error } = await getChildAttendance(selectedId)
        if (error) { setError(error); return }
        setAttendance(data)
      }
    })
  }, [selectedId, tab])

  // Group results by exam type
  const examGroups: { type: string; label: string; rows: ApprovedResult[] }[] = []
  if (results) {
    const map = new Map<string, ApprovedResult[]>()
    for (const r of results) {
      if (!map.has(r.exam_type)) map.set(r.exam_type, [])
      map.get(r.exam_type)!.push(r)
    }
    for (const [type, rows] of map) {
      examGroups.push({ type, label: EXAM_LABELS[type] ?? type, rows })
    }
  }

  function buildMarksheet(groupIndex: number): StudentMarksheet | null {
    if (!selectedChild || !results || results.length === 0) return null
    const currentRows = examGroups[groupIndex]?.rows
    if (!currentRows || currentRows.length === 0) return null
    
    const totalObt = currentRows.reduce((s, r) => s + r.marks_obtained, 0)
    const totalMax = currentRows.reduce((s, r) => s + r.total_marks, 0)
    const pct      = totalMax > 0 ? (totalObt / totalMax) * 100 : 0
    
    // Construct the student object with what we have
    // Parent portal currently doesn't fetch full student profiles for marksheet,
    // but we can piece it together.
    return {
      studentRowId: selectedChild.studentRowId,
      studentCode: selectedChild.studentCode,
      studentName: selectedChild.fullName,
      fatherName: selectedChild.fatherName ?? null,
      motherName: selectedChild.motherName ?? null,
      dob: selectedChild.dob ?? null,
      address: selectedChild.address ?? null,
      classId: 'N/A',
      className: currentRows[0].class_name || selectedChild.className,
      section: currentRows[0].section || selectedChild.section,
      examType: currentRows[0].exam_type,
      teacherName: 'School Admin',
      subjects: currentRows.map(r => ({
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
    <div className="space-y-8">
      {/* ── Child selector ── */}
      <div className="surface-card border-hairline rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
          <label className="text-[10px] font-mono text-mist uppercase tracking-widest whitespace-nowrap">Select Child:</label>
          <div className="relative w-full sm:w-72">
            <select
              id="child-selector"
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setTab('results') }}
              className="w-full bg-surface border border-hairline rounded-xl px-4 py-3 text-sm font-bold text-parchment appearance-none focus:outline-none focus:border-gold transition-colors cursor-pointer shadow-inner"
            >
              {children.map((c) => (
                <option key={c.studentRowId} value={c.studentRowId} className="bg-ink text-parchment">
                  {c.fullName} — {c.className} Sec {c.section}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1.5 input-glass rounded-xl w-full md:w-auto shadow-inner">
          {([['results', BookOpen, 'Results'], ['attendance', CalendarDays, 'Attendance']] as const).map(([t, Icon, lbl]) => (
            <button
              key={t}
              id={`progress-tab-${t}`}
              onClick={() => setTab(t)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                tab === t 
                  ? 'bg-gold text-ink shadow-lg scale-[1.02]' 
                  : 'text-mist hover:text-gold hover:bg-surface'
              }`}
            >
              <Icon className="w-4 h-4" /> {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Child identity banner ── */}
      {selectedChild && (
        <div className="surface-card border-hairline rounded-2xl px-6 py-4 flex items-center gap-5 shadow-lg transform transition-all hover:border-gold/30">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-display font-bold text-xl flex-shrink-0 shadow-inner">
            {selectedChild.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-parchment font-display font-bold text-lg">{selectedChild.fullName}</p>
            <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-1">
              {selectedChild.studentCode} · {selectedChild.className} Sec {selectedChild.section} · {selectedChild.relation}
            </p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isPending && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <span className="text-mist font-mono text-[10px] uppercase tracking-widest">Loading records...</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && !isPending && (
        <div className="surface-card border-hairline rounded-2xl p-6 text-red-400 text-sm font-mono shadow-xl border-red-500/30">
          {error}
        </div>
      )}

      {/* ── RESULTS TAB ── */}
      <AnimatePresence mode="wait">
        {!isPending && tab === 'results' && results !== null && (
          <motion.div key="results-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
            {results.length === 0 ? (
              <div className="surface-card border-hairline rounded-[2rem] p-16 text-center shadow-2xl">
                <BookOpen className="w-16 h-16 text-mist/30 mx-auto mb-6" />
                <p className="text-mist font-mono uppercase tracking-widest text-xs">No approved results yet for this student.</p>
              </div>
            ) : (
              <>
                {/* Overall summary */}
                {(() => {
                  const tot  = results.reduce((s, r) => s + r.marks_obtained, 0)
                  const max  = results.reduce((s, r) => s + r.total_marks, 0)
                  const pct  = max > 0 ? (tot / max) * 100 : 0
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {[
                        { label: 'Total Marks', value: `${tot.toFixed(0)}/${max.toFixed(0)}`, color: 'text-parchment' },
                        { label: 'Percentage',  value: `${pct.toFixed(1)}%`, color: gradeColor(pct) },
                        { label: 'Grade',       value: calcGrade(pct), color: gradeColor(pct) },
                      ].map(({ label, value, color }, i) => (
                        <div key={label} className="surface-card border-hairline rounded-[2rem] p-8 text-center shadow-xl transition-all duration-300 hover:border-gold/30 hover:-translate-y-1" style={{ animationDelay: `${i * 0.1}s` }}>
                          <p className={`font-display text-4xl font-black drop-shadow-md ${color}`}>{value}</p>
                          <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-3">{label}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Exam type tabs */}
                <div className="flex gap-3 flex-wrap">
                  {examGroups.map((g, i) => (
                    <button key={g.type} id={`exam-tab-${g.type}`} onClick={() => setExamTab(i)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                        examTab === i 
                          ? 'bg-gold text-ink shadow-lg scale-105' 
                          : 'bg-surface border border-hairline text-mist hover:text-gold hover:border-gold/50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Marks table actions */}
                {examGroups[examTab] && (
                  <div className="flex justify-end gap-2 mt-4">
                    <button 
                      onClick={() => {
                        const sheet = buildMarksheet(examTab)
                        if (sheet) setPreviewSheet(sheet)
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-mist hover:text-gold hover:bg-gold/10 transition-colors border border-transparent hover:border-gold/30"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Preview Marksheet
                    </button>
                    <button 
                      onClick={() => handleDownloadPDF(examTab)}
                      disabled={isDownloading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gold bg-gold/10 hover:bg-gold/20 transition-colors border border-gold/30 disabled:opacity-50"
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
                )}

                {/* Marks table */}
                {examGroups[examTab] && (
                  <div className="surface-card border-hairline rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-[1fr_80px_80px_80px_80px_90px] gap-4 px-8 py-5 bg-surface border-b border-hairline text-[10px] font-bold text-gold uppercase tracking-widest">
                      <span>Subject</span><span className="text-center">Max</span>
                      <span className="text-center">Pass</span><span className="text-center">Obtained</span>
                      <span className="text-center">Grade</span><span className="text-center">Status</span>
                    </div>
                    <div className="divide-y divide-hairline">
                      {examGroups[examTab].rows.map((r, i) => {
                        const pct   = r.total_marks > 0 ? (r.marks_obtained / r.total_marks) * 100 : 0
                        const pass  = Math.ceil(r.total_marks * 0.33)
                        const ok    = r.marks_obtained >= pass
                        return (
                          <div key={r.id} className="ledger-row grid grid-cols-[1fr_80px_80px_80px_80px_90px] gap-4 px-8 py-5 items-center transition-colors hover:bg-surface/50" style={{ animationDelay: `${i * 0.05}s` }}>
                            <p className="text-sm font-bold text-parchment">{r.subject}</p>
                            <p className="text-center text-[10px] font-mono text-mist">{r.total_marks}</p>
                            <p className="text-center text-[10px] font-mono text-mist">{pass}</p>
                            <p className="text-center text-sm font-bold text-parchment drop-shadow-sm">{r.marks_obtained}</p>
                            <p className={`text-center text-sm font-bold drop-shadow-sm ${gradeColor(pct)}`}>{calcGrade(pct)}</p>
                            <div className="flex justify-center">
                              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {ok ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── ATTENDANCE TAB ── */}
        {!isPending && tab === 'attendance' && attendance !== null && (
          <motion.div key="attendance-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
            {/* Summary */}
            <div className="surface-card border-hairline rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-10 shadow-2xl">
              <PctArc pct={attendance.percentage} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1 w-full">
                {[
                  { label: 'Total', value: attendance.total,   color: 'text-parchment' },
                  { label: 'Present', value: attendance.present, color: 'text-emerald-400' },
                  { label: 'Absent',  value: attendance.absent,  color: 'text-red-400' },
                  { label: 'Late/Half', value: attendance.late + attendance.half_day, color: 'text-amber-400' },
                ].map(({ label, value, color }, i) => (
                  <div key={label} className="bg-ink border border-hairline rounded-2xl p-6 text-center shadow-inner transition-transform hover:scale-105" style={{ animationDelay: `${i * 0.1}s` }}>
                    <p className={`font-display text-3xl font-black drop-shadow-md ${color}`}>{value}</p>
                    <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-2">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Records */}
            {attendance.records.length === 0 ? (
              <div className="surface-card border-hairline rounded-[2rem] p-16 text-center shadow-2xl">
                <CalendarDays className="w-16 h-16 text-mist/30 mx-auto mb-6" />
                <p className="text-mist font-mono uppercase tracking-widest text-xs">No attendance records yet.</p>
              </div>
            ) : (
              <div className="surface-card border-hairline rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="grid grid-cols-[1fr_120px_1fr] gap-6 px-8 py-5 bg-surface border-b border-hairline text-[10px] font-bold text-gold uppercase tracking-widest">
                  <span>Date</span><span className="text-center">Status</span><span>Remarks</span>
                </div>
                <div className="divide-y divide-hairline max-h-[500px] overflow-y-auto styled-scroll">
                  {attendance.records.map((r, i) => (
                    <div key={r.id} className="ledger-row grid grid-cols-[1fr_120px_1fr] gap-6 px-8 py-5 items-center hover:bg-surface/50 transition-colors" style={{ animationDelay: `${i * 0.03}s` }}>
                      <p className="text-sm text-parchment font-bold">
                        {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="flex justify-center"><StatusBadge status={r.status} /></div>
                      <p className="text-[10px] font-mono text-mist uppercase tracking-widest">{r.remarks || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
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
