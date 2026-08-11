'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Eye, User, BookOpen, Calendar, TrendingUp, Award,
  ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle
} from 'lucide-react'
import { approveModificationRequest, rejectModificationRequest } from '@/actions/admin-result-actions'
import type { StudentMarksheet } from '@/actions/admin-result-actions'
import MarksheetModal from '@/components/admin/MarksheetModal'

export interface ModificationRequest {
  id: string
  exam_type: string
  subject: string
  marks_obtained: number
  total_marks: number
  edit_request: { marks_obtained: number; total_marks: number } | null
  delete_request: boolean
  students: {
    student_id: string
    profiles: { full_name: string | null } | null
  } | null
  classes: {
    class_name: string
    section: string
  } | null
}

interface Props {
  marksheets: StudentMarksheet[]
  modRequests?: ModificationRequest[]
}

const EXAM_LABELS: Record<string, string> = {
  unit_test: 'Unit Test',
  mid_term:  'Mid-Term Exam',
  pre_board: 'Pre-Board Exam',
  final:     'Final Exam',
  other:     'Examination',
}

const EXAM_COLORS: Record<string, string> = {
  unit_test: 'text-sky-300 border-sky-500/30',
  mid_term:  'text-veena-blue border-veena-blue/30',
  pre_board: 'text-gold border-gold/30',
  final:     'text-coral border-coral/30',
  other:     'text-mist border-hairline',
}

export default function ResultsClient({ marksheets: initial, modRequests: initialModReqs = [] }: Props) {
  const [sheets, setSheets]         = useState<StudentMarksheet[]>(initial)
  const [modReqs, setModReqs]       = useState<any[]>(initialModReqs)
  const [activeModal, setActiveModal] = useState<StudentMarksheet | null>(null)
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())
  const [search, setSearch]         = useState('')
  const [filterExam, setFilterExam] = useState('all')
  const [isPending, startTransition] = useState(false)

  /* ── Unique exam types present ── */
  const examTypes = Array.from(new Set(sheets.map((s) => s.examType)))

  /* ── Filter ── */
  const filtered = sheets.filter((s) => {
    const matchSearch =
      search === '' ||
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      s.className.toLowerCase().includes(search.toLowerCase())
    const matchExam = filterExam === 'all' || s.examType === filterExam
    return matchSearch && matchExam
  })

  /* ── Group by class ── */
  const byClass = new Map<string, StudentMarksheet[]>()
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

  function handleApproved() {
    if (!activeModal) return
    // Optimistically remove from list
    setSheets((prev) =>
      prev.filter(
        (s) =>
          !(s.studentRowId === activeModal.studentRowId && s.examType === activeModal.examType)
      )
    )
    setActiveModal(null)
  }

  async function handleModRequest(ids: string[], actionType: 'edit' | 'delete', approve: boolean) {
    if (!confirm(`Are you sure you want to ${approve ? 'approve' : 'reject'} this ${actionType} request for ${ids.length} subject(s)?`)) return
    startTransition(true)
    const res = approve ? await approveModificationRequest(ids, actionType) : await rejectModificationRequest(ids)
    if (res.success) {
      setModReqs(prev => prev.filter(r => !ids.includes(r.id)))
    } else {
      alert(res.error)
    }
    startTransition(false)
  }

  async function handleGlobalModRequest(approve: boolean) {
    if (modReqs.length === 0) return
    if (!confirm(`Are you sure you want to globally ${approve ? 'approve' : 'reject'} ALL ${modReqs.length} pending modification request(s)?`)) return
    
    startTransition(true)
    let hasError = false
    let errMsg = ''

    if (approve) {
      const deleteIds = modReqs.filter(r => r.delete_request).map(r => r.id)
      const editIds = modReqs.filter(r => r.edit_request).map(r => r.id)

      if (deleteIds.length > 0) {
        const res = await approveModificationRequest(deleteIds, 'delete')
        if (!res.success) { hasError = true; errMsg = res.error || 'Failed to approve delete requests' }
      }
      if (editIds.length > 0) {
        const res = await approveModificationRequest(editIds, 'edit')
        if (!res.success) { hasError = true; errMsg = res.error || 'Failed to approve edit requests' }
      }
    } else {
      const allIds = modReqs.map(r => r.id)
      const res = await rejectModificationRequest(allIds)
      if (!res.success) { hasError = true; errMsg = res.error || 'Failed to reject requests' }
    }

    if (hasError) {
      alert(errMsg)
    } else {
      setModReqs([])
    }
    startTransition(false)
  }

  return (
    <>
      {/* ── Modification Requests ── */}
      {modReqs.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-coral flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Modification Requests ({modReqs.length})
            </h2>
            {modReqs.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGlobalModRequest(true)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-bold border border-emerald-500/30 uppercase tracking-widest"
                >
                  Approve All
                </button>
                <button
                  onClick={() => handleGlobalModRequest(false)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-bold border border-red-500/30 uppercase tracking-widest"
                >
                  Reject All
                </button>
              </div>
            )}
          </div>
          <div className="grid gap-3">
            {(() => {
              // Group modification requests by student + exam + action type
              const groupedMods = new Map<string, {
                type: 'delete' | 'edit';
                studentName: string;
                studentId: string;
                className: string;
                section: string;
                examType: string;
                requests: ModificationRequest[];
              }>()

              modReqs.forEach((req: ModificationRequest) => {
                const type = req.delete_request ? 'delete' : 'edit'
                const key = `${req.students?.student_id}_${req.exam_type}_${type}`
                
                if (!groupedMods.has(key)) {
                  groupedMods.set(key, {
                    type,
                    studentName: req.students?.profiles?.full_name || 'Unknown',
                    studentId: req.students?.student_id || 'Unknown',
                    className: req.classes?.class_name || '',
                    section: req.classes?.section || '',
                    examType: req.exam_type,
                    requests: []
                  })
                }
                groupedMods.get(key)!.requests.push(req)
              })

              return Array.from(groupedMods.values()).map((group, index) => {
                const key = `${group.studentId}_${group.examType}_${group.type}`
                const reqIds = group.requests.map(r => r.id)
                const subjectNames = group.requests.map(r => r.subject).join(', ')

                return (
                  <div key={key} className="glass rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-coral/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-parchment">{group.studentName}</span>
                        <span className="text-xs text-mist">{group.studentId}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full border text-coral/80 border-coral/30 bg-coral/10 uppercase tracking-widest">
                          {group.type === 'delete' ? 'Delete Request' : 'Edit Request'}
                        </span>
                        {group.requests.length > 1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full border text-veena-blue border-veena-blue/30 bg-veena-blue/10">
                            {group.requests.length} Subjects
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-mist/80 mt-1">
                        {group.className} {group.section !== '-' ? group.section : ''} • {group.examType}
                      </div>
                      <div className="text-sm text-parchment mt-1">
                        <span className="text-mist text-xs uppercase tracking-wider mr-2">Subjects:</span>
                        {subjectNames}
                      </div>
                      {group.type === 'edit' && group.requests.map(req => (
                        <div key={req.id} className="text-xs text-veena-blue mt-1">
                          {req.subject}: New Marks <span className="font-bold">{req.edit_request?.marks_obtained}</span> / {req.edit_request?.total_marks}
                          <span className="text-mist ml-2">(Old: {req.marks_obtained} / {req.total_marks})</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleModRequest(reqIds, group.type, true)}
                        disabled={isPending}
                        className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-semibold border border-emerald-500/30 flex items-center gap-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleModRequest(reqIds, group.type, false)}
                        disabled={isPending}
                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-semibold border border-red-500/30 flex items-center gap-2"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* ── Filters bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="results-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student name, ID, class..."
          className="input-glass rounded-xl px-4 py-2.5 text-sm flex-1 text-parchment placeholder-mist/40 focus:outline-none focus:border-coral/60 transition-all"
        />
        <select
          id="results-exam-filter"
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

      {/* ── No results after filter ── */}
      {filtered.length === 0 && (
        <div className="surface-card border border-hairline rounded-xl p-8 text-center text-mist text-sm">
          No pending results match your filter.
        </div>
      )}

      {/* ── Class groups ── */}
      <div className="space-y-5">
        {Array.from(byClass.entries()).map(([classLabel, classSheets]) => {
          const isOpen = expanded.has(classLabel)
          return (
            <div key={classLabel} className="surface-card rounded-2xl overflow-hidden border border-hairline">
              {/* Class header (collapsible) */}
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
                    <p className="text-mist text-xs">{classSheets.length} result{classSheets.length !== 1 ? 's' : ''} pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-gold border border-gold/30"
                    style={{ background: 'rgba(212,175,106,0.08)' }}>
                    {classSheets.length} pending
                  </span>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-mist" />
                    : <ChevronDown className="w-4 h-4 text-mist" />}
                </div>
              </button>

              {/* Student result cards */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
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
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-coral font-bold text-sm flex-shrink-0 border border-coral/30"
                                style={{ background: 'rgba(241,145,125,0.1)' }}>
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
                                  {s.teacherName && (
                                    <span className="text-xs text-mist flex items-center gap-1">
                                      <Clock className="w-3 h-3" />by {s.teacherName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Stats chips */}
                            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                              <div className="flex items-center gap-1.5 text-xs">
                                <TrendingUp className="w-3.5 h-3.5 text-coral" />
                                <span className="text-parchment font-semibold font-mono">
                                  {s.totalObtained}/{s.grandTotal}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <Calendar className="w-3.5 h-3.5 text-mist" />
                                <span className="text-parchment font-semibold font-mono">
                                  {s.percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <Award className="w-3.5 h-3.5 text-gold" />
                                <span className="text-parchment font-bold">{s.grade}</span>
                              </div>
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                  isPassed
                                    ? 'text-emerald-400 border-emerald-500/25'
                                    : 'text-red-400 border-red-500/25'
                                }`}
                                style={{ background: isPassed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}
                              >
                                {isPassed ? '✓ PASS' : '✗ FAIL'}
                              </span>
                            </div>

                            {/* Preview button */}
                            <button
                              id={`preview-marksheet-${s.studentRowId}-${s.examType}`}
                              onClick={() => setActiveModal(s)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all text-ink hover:scale-[1.02]"
                              style={{ background: 'var(--coral)' }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview Marksheet
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* ── Approved indicator ── */}
      {sheets.length > 0 && filtered.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-6 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5" />
          All filtered results have been approved!
        </div>
      )}

      {/* ── Marksheet modal ── */}
      <AnimatePresence>
        {activeModal && (
          <MarksheetModal
            sheet={activeModal}
            onClose={() => setActiveModal(null)}
            onApproved={handleApproved}
          />
        )}
      </AnimatePresence>
    </>
  )
}
