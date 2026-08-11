import { BookOpen, Award, TrendingUp } from 'lucide-react'
import { getStudentResults, getStudentProfile } from '@/actions/portal-actions'
import { calcGrade, groupResultsByExam } from '@/utils/helpers'
import ResultsTabsClient from './ResultsTabsClient'

export const dynamic = 'force-dynamic'

const EXAM_LABELS: Record<string, string> = {
  unit_test: 'Unit Test', mid_term: 'Mid-Term Exam',
  pre_board: 'Pre-Board Exam', final: 'Final Exam', other: 'Examination',
}

export default async function StudentResultsPage() {
  const [{ data: results, error }, { data: profile }] = await Promise.all([
    getStudentResults(),
    getStudentProfile()
  ])

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="surface-card border-hairline rounded-2xl p-6 text-red-400 text-sm font-mono shadow-xl border-red-500/30">
          {error}
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="surface-card border-hairline rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner flex-shrink-0">
            <BookOpen className="w-8 h-8 text-veena-blue" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-parchment">
              My Results
            </h1>
            <p className="text-mist mt-2 text-sm max-w-md">
              Your approved exam results will appear here.
            </p>
          </div>
        </div>
        <div className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-mist/50" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-parchment">No Results Yet</h2>
            <p className="text-mist text-sm max-w-md mt-2 mx-auto">
              No approved results found. Check back after your teacher uploads and the admin approves your marks.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const grouped = groupResultsByExam(results)
  const examTypes = Array.from(grouped.keys())

  // Overall stats
  const totalObtained = results.reduce((s, r) => s + r.marks_obtained, 0)
  const grandTotal    = results.reduce((s, r) => s + r.total_marks, 0)
  const overallPct    = grandTotal > 0 ? (totalObtained / grandTotal) * 100 : 0
  const overallGrade  = calcGrade(overallPct)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="surface-card border-hairline rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner flex-shrink-0">
          <BookOpen className="w-8 h-8 text-veena-blue" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment">
            My Results
          </h1>
          <p className="text-mist mt-2 text-sm max-w-md">
            All approved exam results are shown below.
          </p>
        </div>
      </div>

      {/* Overall summary pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="surface-card border-hairline rounded-[2rem] p-8 text-center shadow-xl transition-transform hover:-translate-y-1">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 border shadow-inner bg-veena-blue/10 border-veena-blue/20">
            <TrendingUp className="w-6 h-6 text-veena-blue" />
          </div>
          <p className="font-display text-4xl font-black drop-shadow-md text-parchment">{totalObtained.toFixed(0)}/{grandTotal.toFixed(0)}</p>
          <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-3">Total Marks</p>
        </div>
        <div className="surface-card border-hairline rounded-[2rem] p-8 text-center shadow-xl transition-transform hover:-translate-y-1" style={{ animationDelay: '0.1s' }}>
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 border shadow-inner bg-amber-500/10 border-amber-500/20">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
          <p className="font-display text-4xl font-black drop-shadow-md text-amber-400">{overallPct.toFixed(1)}%</p>
          <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-3">Overall %</p>
        </div>
        <div className="surface-card border-hairline rounded-[2rem] p-8 text-center shadow-xl transition-transform hover:-translate-y-1" style={{ animationDelay: '0.2s' }}>
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 border shadow-inner bg-violet-500/10 border-violet-500/20">
            <Award className="w-6 h-6 text-violet-400" />
          </div>
          <p className={`font-display text-4xl font-black drop-shadow-md ${overallPct >= 33 ? 'text-emerald-400' : 'text-red-400'}`}>{overallGrade}</p>
          <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-3">Overall Grade</p>
        </div>
      </div>

      {/* Tabbed results by exam type */}
      <ResultsTabsClient grouped={Array.from(grouped.entries()).map(([type, rows]) => ({
        examType: type,
        label: EXAM_LABELS[type] ?? type,
        rows,
      }))} examTypes={examTypes} profile={profile!} />
    </div>
  )
}
