import { BookOpen } from 'lucide-react'

export default function TeacherResultsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="surface-card border-hairline rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner flex-shrink-0">
          <BookOpen className="w-8 h-8 text-veena-blue" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment">
            Upload Results
          </h1>
          <p className="text-mist mt-2 text-sm max-w-sm">
            Result upload system history and past submissions.
          </p>
        </div>
      </div>

      <div className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-mist/50" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-parchment">Coming Soon</h2>
          <p className="text-mist text-sm max-w-md mt-2 mx-auto">
            The results upload history feature is currently under construction.
            Please use the My Classes page to upload results.
          </p>
        </div>
      </div>
    </div>
  )
}
