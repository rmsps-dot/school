'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import {
  X, Upload, ChevronDown, Loader2, CheckCircle2, AlertCircle, BookOpen,
  FlaskConical, FileText,
} from 'lucide-react'
import { getStudentsForClass, uploadResults, type StudentInClass } from '@/actions/result-actions'

/* ════════════════════════════════════════════════════════════
   SUBJECT MATRIX — per class group
════════════════════════════════════════════════════════════ */

type Stream = 'Science' | 'Arts' | 'Commerce'
type ResultMode = 'test' | 'exam'

function parseClassNumber(className: string): number {
  const match = className.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

function getCoreSubjects(className: string, stream?: Stream): { label: string; value: string }[] {
  const num = parseClassNumber(className)

  if (num >= 1 && num <= 6) {
    return [
      { label: 'English', value: 'English' },
      { label: 'Hindi', value: 'Hindi' },
      { label: 'Mathematics', value: 'Mathematics' },
      { label: 'Science', value: 'Science' },
      { label: 'Social Science', value: 'Social Science' },
      { label: 'General Knowledge', value: 'GK' },
    ]
  }

  if (num >= 7 && num <= 10) {
    return [
      { label: 'English', value: 'English' },
      { label: 'Hindi', value: 'Hindi' },
      { label: 'Mathematics', value: 'Mathematics' },
      { label: 'Science', value: 'Science' },
      { label: 'S.St — History', value: 'Social Science: History' },
      { label: 'S.St — Economics', value: 'Social Science: Economics' },
      { label: 'S.St — Geography', value: 'Social Science: Geography' },
      { label: 'S.St — Civics', value: 'Social Science: Civics' },
      { label: 'Sanskrit', value: 'Sanskrit' },
    ]
  }

  if (num >= 11 && num <= 12) {
    if (!stream) return []
    const core: Record<Stream, { label: string; value: string }[]> = {
      Science: [
        { label: 'Physics', value: 'Physics' },
        { label: 'Chemistry', value: 'Chemistry' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'Biology', value: 'Biology' },
        { label: 'English', value: 'English' },
      ],
      Arts: [
        { label: 'History', value: 'History' },
        { label: 'Political Science', value: 'Political Science' },
        { label: 'Geography', value: 'Geography' },
        { label: 'Hindi', value: 'Hindi' },
        { label: 'English', value: 'English' },
      ],
      Commerce: [
        { label: 'Accountancy', value: 'Accountancy' },
        { label: 'Business Studies', value: 'Business Studies' },
        { label: 'Economics', value: 'Economics' },
        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'English', value: 'English' },
      ],
    }
    return core[stream]
  }

  return []
}

const EXTRA_SUBJECTS: Record<Stream, { label: string; value: string }[]> = {
  Science: [
    { label: 'Computer Science', value: 'Computer Science' },
    { label: 'Physical Education', value: 'Physical Education' },
    { label: 'Hindi', value: 'Hindi' },
  ],
  Arts: [
    { label: 'Sociology', value: 'Sociology' },
    { label: 'Psychology', value: 'Psychology' },
    { label: 'Physical Education', value: 'Physical Education' },
  ],
  Commerce: [
    { label: 'Informatics Practices', value: 'Informatics Practices' },
    { label: 'Physical Education', value: 'Physical Education' },
    { label: 'Hindi', value: 'Hindi' },
  ],
}

const TEST_EXAM_TYPES = [
  { label: 'Unit Test 1', value: 'unit_test' },
  { label: 'Unit Test 2', value: 'unit_test_2' },
  { label: 'Monthly Test', value: 'monthly_test' },
  { label: 'Other Test', value: 'other' },
] as const

const FULL_EXAM_TYPES = [
  { label: 'Mid-Term Exam', value: 'mid_term' },
  { label: 'Pre-Board Exam', value: 'pre_board' },
  { label: 'Final Exam', value: 'final' },
  { label: 'Other Exam', value: 'other' },
] as const

/* ════════════════════════════════════════════════════════════
   PROPS
════════════════════════════════════════════════════════════ */
interface ResultUploadModalProps {
  classId: string
  className: string
  section: string
  onClose: () => void
}

/* ════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════ */
export default function ResultUploadModal({
  classId,
  className,
  section,
  onClose,
}: ResultUploadModalProps) {
  const classNum = parseClassNumber(className)
  const needsStream = classNum >= 11

  const [mode, setMode] = useState<ResultMode | null>(null)
  const [stream, setStream] = useState<Stream | ''>('')
  const [examType, setExamType] = useState<string>('')
  const [students, setStudents] = useState<StudentInClass[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState('')
  const [isPending, startTransition] = useTransition()

  // TEST mode
  const [testSubject, setTestSubject] = useState('')
  const [testMarks, setTestMarks] = useState<Record<string, string>>({})
  const [testGlobalTotal, setTestGlobalTotal] = useState('100')

  // EXAM mode
  const [examMarks, setExamMarks] = useState<Record<string, Record<string, string>>>({})
  const [examGlobalTotal, setExamGlobalTotal] = useState('100')
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])

  const effectiveStream = needsStream ? (stream as Stream | undefined) : undefined
  const coreSubjects = getCoreSubjects(className, effectiveStream)
  const extraOptions = needsStream && stream ? EXTRA_SUBJECTS[stream as Stream] : []
  const examSubjects = [
    ...coreSubjects,
    ...extraOptions.filter((e) => selectedExtras.includes(e.value)),
  ]

  useEffect(() => {
    setLoadingStudents(true)
    setStudentsError('')
    getStudentsForClass(classId).then(({ data, error }) => {
      setLoadingStudents(false)
      if (error) { setStudentsError(error); return }
      setStudents(data)
      const init: Record<string, string> = {}
      data.forEach((s) => { init[s.studentRowId] = '' })
      setTestMarks(init)
    })
  }, [classId])

  useEffect(() => {
    setTestSubject('')
    setTestMarks((prev) => {
      const r: Record<string, string> = {}
      Object.keys(prev).forEach((k) => { r[k] = '' })
      return r
    })
  }, [mode, stream])

  const toggleExtra = (val: string) =>
    setSelectedExtras((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )

  const setTestMark = useCallback((id: string, v: string) => {
    setTestMarks((prev) => ({ ...prev, [id]: v }))
  }, [])

  const setExamMark = useCallback((sub: string, id: string, v: string) => {
    setExamMarks((prev) => ({ ...prev, [sub]: { ...(prev[sub] ?? {}), [id]: v } }))
  }, [])

  function handleTestSubmit() {
    if (!examType) { setSubmitError('Please select exam type.'); return }
    if (needsStream && !stream) { setSubmitError('Please select a stream.'); return }
    if (!testSubject) { setSubmitError('Please select a subject.'); return }
    const tot = parseFloat(testGlobalTotal)
    if (isNaN(tot) || tot <= 0) { setSubmitError('Full Marks must be a positive number.'); return }
    const entries: { studentRowId: string; marksObtained: number; totalMarks: number }[] = []
    for (const s of students) {
      const val = testMarks[s.studentRowId]
      if (!val || val.trim() === '') continue
      const obt = parseFloat(val)
      if (isNaN(obt) || obt < 0) { setSubmitError(`Invalid marks for ${s.fullName}.`); return }
      if (obt > tot) { setSubmitError(`Marks exceed total for ${s.fullName}.`); return }
      entries.push({ studentRowId: s.studentRowId, marksObtained: obt, totalMarks: tot })
    }
    if (entries.length === 0) { setSubmitError('Please fill marks for at least one student.'); return }
    setSubmitError('')
    startTransition(async () => {
      const result = await uploadResults({
        classId,
        examType: examType as 'unit_test' | 'mid_term' | 'pre_board' | 'final' | 'other',
        subject: testSubject,
        marks: entries,
      })
      if (result.success) setSubmitState('success')
      else { setSubmitState('error'); setSubmitError(result.error ?? 'Unknown error') }
    })
  }

  function handleExamSubmit() {
    if (!examType) { setSubmitError('Please select exam type.'); return }
    if (needsStream && !stream) { setSubmitError('Please select a stream.'); return }
    if (examSubjects.length === 0) { setSubmitError('No subjects available.'); return }
    const tot = parseFloat(examGlobalTotal)
    if (isNaN(tot) || tot <= 0) { setSubmitError('Full Marks must be a positive number.'); return }
    const batches: { subject: string; marks: { studentRowId: string; marksObtained: number; totalMarks: number }[] }[] = []
    for (const sub of examSubjects) {
      const subMap = examMarks[sub.value] ?? {}
      const entries: { studentRowId: string; marksObtained: number; totalMarks: number }[] = []
      for (const s of students) {
        const val = subMap[s.studentRowId]
        if (!val || val.trim() === '') continue
        const obt = parseFloat(val)
        if (isNaN(obt) || obt < 0) { setSubmitError(`Invalid marks for ${s.fullName} in ${sub.label}.`); return }
        if (obt > tot) { setSubmitError(`Marks exceed total for ${s.fullName} in ${sub.label}.`); return }
        entries.push({ studentRowId: s.studentRowId, marksObtained: obt, totalMarks: tot })
      }
      if (entries.length > 0) batches.push({ subject: sub.value, marks: entries })
    }
    if (batches.length === 0) { setSubmitError('Please fill marks for at least one student.'); return }
    setSubmitError('')
    startTransition(async () => {
      for (const batch of batches) {
        const result = await uploadResults({
          classId,
          examType: examType as 'unit_test' | 'mid_term' | 'pre_board' | 'final' | 'other',
          subject: batch.subject,
          marks: batch.marks,
        })
        if (!result.success) {
          setSubmitState('error')
          setSubmitError(`Error in ${batch.subject}: ${result.error}`)
          return
        }
      }
      setSubmitState('success')
    })
  }

  const numInputCls =
    'bg-ink border border-hairline rounded-lg px-2 py-1.5 text-sm text-center font-bold text-parchment focus:outline-none focus:border-veena-blue transition-colors shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(11,11,16,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative surface-card border-hairline rounded-3xl w-full max-w-5xl flex flex-col shadow-2xl"
        style={{ maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-hairline flex-shrink-0 bg-surface">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner">
              <Upload className="w-5 h-5 text-veena-blue" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-parchment">Upload Results</h2>
              <p className="text-[10px] font-mono uppercase tracking-widest text-mist mt-0.5">
                {className} — Section {section}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface border border-hairline flex items-center justify-center text-mist hover:text-veena-blue hover:border-veena-blue transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-ink">

          {/* Success */}
          {submitState === 'success' && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="font-display text-2xl font-bold text-parchment">Results Uploaded!</h3>
              <p className="text-mist text-sm text-center max-w-sm font-mono tracking-widest uppercase">
                Results have been submitted and are pending admin approval.
              </p>
              <button onClick={onClose} className="mt-4 px-8 py-3 rounded-xl bg-surface border border-hairline font-bold text-xs uppercase tracking-wider text-mist hover:text-parchment transition-colors">
                Close
              </button>
            </div>
          )}

          {submitState !== 'success' && (
            <>
              {/* STEP 1: Mode Selection */}
              {!mode && (
                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-veena-blue uppercase tracking-widest border-b border-hairline pb-2">
                    Step 1 — Select Result Type
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => { setMode('test'); setExamType(TEST_EXAM_TYPES[0].value) }}
                      className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-hairline bg-surface hover:border-amber-400 hover:bg-amber-500/5 transition-all text-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                        <FileText className="w-7 h-7 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-parchment text-lg">Test Result</h4>
                        <p className="text-xs text-mist mt-1 font-mono uppercase tracking-widest">Single subject · Unit test</p>
                      </div>
                    </button>
                    <button
                      onClick={() => { setMode('exam'); setExamType(FULL_EXAM_TYPES[0].value) }}
                      className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-hairline bg-surface hover:border-veena-blue hover:bg-veena-blue/5 transition-all text-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center group-hover:bg-veena-blue/20 transition-colors">
                        <FlaskConical className="w-7 h-7 text-veena-blue" />
                      </div>
                      <div>
                        <h4 className="font-bold text-parchment text-lg">Exam Result</h4>
                        <p className="text-xs text-mist mt-1 font-mono uppercase tracking-widest">All subjects · Mid-term · Final</p>
                      </div>
                    </button>
                  </div>
                </section>
              )}

              {/* STEP 2+: After mode selected */}
              {mode && (
                <>
                  {/* Mode badge + back */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setMode(null); setStream(''); setExamType(''); setTestSubject(''); setSelectedExtras([]) }}
                      className="text-mist hover:text-parchment text-xs font-mono uppercase tracking-widest transition-colors"
                    >
                      ← Change type
                    </button>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${mode === 'test' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-veena-blue/10 text-veena-blue border-veena-blue/30'}`}>
                      {mode === 'test' ? 'Test Result' : 'Exam Result'}
                    </span>
                  </div>

                  {/* Config */}
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-bold text-veena-blue uppercase tracking-widest border-b border-hairline pb-2">Step 2 — Details</h3>
                    <div className={`grid gap-4 ${needsStream ? 'sm:grid-cols-3' : 'sm:grid-cols-3'}`}>
                      {/* Exam/Test type */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-mist uppercase tracking-widest">{mode === 'test' ? 'Test Type' : 'Exam Type'}</label>
                        <div className="relative">
                          <select
                            value={examType}
                            onChange={(e) => setExamType(e.target.value)}
                            className="w-full bg-surface border border-hairline rounded-xl px-4 py-3 text-sm text-parchment appearance-none focus:outline-none focus:border-veena-blue transition-colors cursor-pointer"
                          >
                            {(mode === 'test' ? TEST_EXAM_TYPES : FULL_EXAM_TYPES).map((t) => (
                              <option key={t.value} value={t.value} className="bg-ink">{t.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
                        </div>
                      </div>

                      {/* Stream */}
                      {needsStream && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-mist uppercase tracking-widest">Stream <span className="text-red-400">*</span></label>
                          <div className="relative">
                            <select
                              value={stream}
                              onChange={(e) => setStream(e.target.value as Stream | '')}
                              className="w-full bg-surface border border-hairline rounded-xl px-4 py-3 text-sm text-parchment appearance-none focus:outline-none focus:border-veena-blue transition-colors cursor-pointer"
                            >
                              <option value="" className="bg-ink">— Select Stream —</option>
                              {(['Science', 'Arts', 'Commerce'] as Stream[]).map((s) => (
                                <option key={s} value={s} className="bg-ink">{s}</option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
                          </div>
                        </div>
                      )}

                      {/* Subject (TEST only) */}
                      {mode === 'test' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-mist uppercase tracking-widest">Subject <span className="text-red-400">*</span></label>
                          <div className="relative">
                            <select
                              value={testSubject}
                              onChange={(e) => setTestSubject(e.target.value)}
                              disabled={needsStream && !stream}
                              className="w-full bg-surface border border-hairline rounded-xl px-4 py-3 text-sm text-parchment appearance-none focus:outline-none focus:border-veena-blue transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <option value="" className="bg-ink">— Select Subject —</option>
                              {coreSubjects.map((s) => (
                                <option key={s.value} value={s.value} className="bg-ink">{s.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
                          </div>
                          {needsStream && !stream && (
                            <p className="text-[10px] text-amber-400 uppercase tracking-widest mt-1">Select a stream first</p>
                          )}
                        </div>
                      )}

                      {/* Full marks */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-mist uppercase tracking-widest">Full Marks</label>
                        <input
                          type="number"
                          min="1"
                          value={mode === 'test' ? testGlobalTotal : examGlobalTotal}
                          onChange={(e) => mode === 'test' ? setTestGlobalTotal(e.target.value) : setExamGlobalTotal(e.target.value)}
                          className="w-full bg-surface border border-hairline rounded-xl px-4 py-3 text-sm font-bold text-parchment focus:outline-none focus:border-veena-blue transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    {/* Extra subjects (EXAM + class 11/12) */}
                    {mode === 'exam' && needsStream && stream && extraOptions.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-mono text-mist uppercase tracking-widest">
                          Optional Extra Subject(s) — {stream}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {extraOptions.map((opt) => {
                            const active = selectedExtras.includes(opt.value)
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => toggleExtra(opt.value)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${active ? 'bg-veena-blue text-ink border-veena-blue' : 'bg-surface border-hairline text-mist hover:border-veena-blue hover:text-parchment'}`}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Marks table */}
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-bold text-veena-blue uppercase tracking-widest border-b border-hairline pb-2">
                      Step 3 — Enter Marks
                    </h3>

                    {loadingStudents && (
                      <div className="flex items-center justify-center py-12 gap-3">
                        <Loader2 className="w-7 h-7 text-veena-blue animate-spin" />
                        <span className="text-xs font-mono uppercase tracking-widest text-mist">Loading students...</span>
                      </div>
                    )}

                    {studentsError && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono uppercase tracking-widest">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />{studentsError}
                      </div>
                    )}

                    {!loadingStudents && !studentsError && students.length === 0 && (
                      <div className="flex flex-col items-center py-12 gap-4 text-mist opacity-50">
                        <BookOpen className="w-12 h-12" />
                        <p className="text-[10px] font-mono uppercase tracking-widest">No students found.</p>
                      </div>
                    )}

                    {/* TEST table */}
                    {mode === 'test' && !loadingStudents && students.length > 0 && (
                      <div className="surface-card border-hairline rounded-2xl overflow-hidden shadow-lg">
                        <div className="grid grid-cols-[auto_1fr_130px] gap-4 px-6 py-3 bg-surface border-b border-hairline text-[10px] font-bold text-veena-blue uppercase tracking-widest">
                          <span>#</span><span>Student</span><span className="text-center">Marks / {testGlobalTotal}</span>
                        </div>
                        <div className="divide-y divide-hairline">
                          {students.map((s, idx) => {
                            const val = testMarks[s.studentRowId] ?? ''
                            const obt = parseFloat(val)
                            const tot = parseFloat(testGlobalTotal)
                            const isOver = !isNaN(obt) && !isNaN(tot) && obt > tot
                            const pct = !isNaN(obt) && !isNaN(tot) && tot > 0 ? (obt / tot) * 100 : null
                            return (
                              <div key={s.studentRowId} className={`grid grid-cols-[auto_1fr_130px] gap-4 items-center px-6 py-3 transition-colors ${isOver ? 'bg-red-500/10' : 'hover:bg-surface'}`}>
                                <span className="text-xs font-mono text-mist w-6 text-right">{idx + 1}</span>
                                <div>
                                  <p className="text-sm font-bold text-parchment truncate">{s.fullName}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono text-mist">{s.studentCode}</span>
                                    {pct !== null && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pct >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : pct >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {pct.toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <input
                                  type="number" min="0" step="0.5"
                                  value={val}
                                  onChange={(e) => setTestMark(s.studentRowId, e.target.value)}
                                  placeholder="—"
                                  className={`${numInputCls} w-full ${isOver ? 'border-red-500/60 text-red-400' : ''}`}
                                />
                              </div>
                            )
                          })}
                        </div>
                        <div className="px-6 py-3 bg-surface border-t border-hairline text-right">
                          <span className="text-[10px] font-mono text-mist uppercase tracking-widest">{students.length} student{students.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}

                    {/* EXAM table */}
                    {mode === 'exam' && !loadingStudents && students.length > 0 && (
                      <>
                        {examSubjects.length === 0 ? (
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {needsStream && !stream ? 'Please select a stream above to see subjects.' : 'No subjects configured.'}
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-hairline shadow-lg">
                            <table className="min-w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-surface border-b border-hairline">
                                  <th className="text-left px-4 py-3 text-[10px] font-bold text-veena-blue uppercase tracking-widest sticky left-0 bg-surface z-10 min-w-[150px]">Student</th>
                                  {examSubjects.map((sub) => (
                                    <th key={sub.value} className="px-3 py-3 text-[10px] font-bold text-veena-blue uppercase tracking-widest text-center min-w-[90px] whitespace-nowrap">
                                      {sub.label}
                                    </th>
                                  ))}
                                </tr>
                                <tr className="bg-ink border-b border-hairline">
                                  <td className="px-4 py-2 text-[10px] font-mono text-mist sticky left-0 bg-ink">Full Marks</td>
                                  {examSubjects.map((sub) => (
                                    <td key={sub.value} className="px-3 py-2 text-center text-[10px] font-bold text-mist">{examGlobalTotal}</td>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-hairline">
                                {students.map((s) => (
                                  <tr key={s.studentRowId} className="hover:bg-surface transition-colors">
                                    <td className="px-4 py-3 sticky left-0 bg-ink hover:bg-surface transition-colors z-10">
                                      <p className="font-bold text-parchment truncate max-w-[140px]">{s.fullName}</p>
                                      <p className="text-[10px] font-mono text-mist mt-0.5">{s.studentCode}</p>
                                    </td>
                                    {examSubjects.map((sub) => {
                                      const val = (examMarks[sub.value] ?? {})[s.studentRowId] ?? ''
                                      const obt = parseFloat(val)
                                      const tot = parseFloat(examGlobalTotal)
                                      const isOver = !isNaN(obt) && !isNaN(tot) && obt > tot
                                      return (
                                        <td key={sub.value} className="px-2 py-2 text-center">
                                          <input
                                            type="number" min="0" step="0.5"
                                            value={val}
                                            onChange={(e) => setExamMark(sub.value, s.studentRowId, e.target.value)}
                                            placeholder="—"
                                            className={`${numInputCls} w-full ${isOver ? 'border-red-500/60 text-red-400' : ''}`}
                                            style={{ minWidth: 70 }}
                                          />
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </section>

                  {/* Error */}
                  {(submitError || submitState === 'error') && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {submitState !== 'success' && mode && (
          <div className="flex items-center justify-end gap-4 p-6 border-t border-hairline flex-shrink-0 bg-surface">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-6 py-3 rounded-xl bg-ink border border-hairline text-xs font-bold uppercase tracking-wider text-mist disabled:opacity-50 hover:border-mist transition-colors"
            >
              Cancel
            </button>
            <button
              id="result-submit-btn"
              onClick={mode === 'test' ? handleTestSubmit : handleExamSubmit}
              disabled={isPending || loadingStudents || students.length === 0}
              className="px-8 py-3 rounded-xl bg-veena-blue text-ink font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#5C94FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4" /> Submit Results</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
