import { CalendarDays, CheckCircle2, XCircle, Clock, Minus } from 'lucide-react'
import { getStudentAttendance } from '@/actions/portal-actions'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
    present:  { label: 'Present',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', Icon: CheckCircle2 },
    absent:   { label: 'Absent',   cls: 'bg-red-500/10    text-red-400    border-red-500/20',       Icon: XCircle     },
    late:     { label: 'Late',     cls: 'bg-amber-500/10  text-amber-400  border-amber-500/20',     Icon: Clock       },
    half_day: { label: 'Half Day', cls: 'bg-veena-blue/10 text-veena-blue border-veena-blue/20',    Icon: Minus       },
  }
  const cfg = map[status] ?? { label: status, cls: 'bg-surface border-hairline text-mist', Icon: Minus }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-inner ${cfg.cls}`}>
      <cfg.Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

function PctArc({ pct }: { pct: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(243,239,230,0.05)" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill={color}
        className="font-display font-bold text-xl drop-shadow">{pct}%</text>
    </svg>
  )
}

export default async function StudentAttendancePage() {
  const { data, error } = await getStudentAttendance()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="surface-card border-hairline rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-veena-blue/10 border border-veena-blue/30 flex items-center justify-center shadow-inner flex-shrink-0">
          <CalendarDays className="w-8 h-8 text-veena-blue" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-parchment">
            My Attendance
          </h1>
          <p className="text-mist mt-2 text-sm max-w-md">
            Your daily attendance record for this academic year.
          </p>
        </div>
      </div>

      {error && (
        <div className="surface-card border-hairline rounded-2xl p-6 text-red-400 text-sm font-mono shadow-xl border-red-500/30">
          {error}
        </div>
      )}

      {/* Summary card */}
      <div className="surface-card border-hairline rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-10 shadow-2xl">
        <PctArc pct={data.percentage} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1 w-full">
          {[
            { label: 'Total Days', value: data.total,    color: 'text-parchment' },
            { label: 'Present',    value: data.present,  color: 'text-emerald-400' },
            { label: 'Absent',     value: data.absent,   color: 'text-red-400' },
            { label: 'Late/Half',  value: data.late + data.half_day, color: 'text-amber-400' },
          ].map(({ label, value, color }, i) => (
            <div key={label} className="bg-ink border border-hairline rounded-2xl p-6 text-center shadow-inner transition-transform hover:-translate-y-1" style={{ animationDelay: `${i * 0.1}s` }}>
              <p className={`font-display text-3xl font-black drop-shadow-md ${color}`}>{value}</p>
              <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-3">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 75% warning */}
      {data.percentage < 75 && data.total > 0 && (
        <div className="surface-card border-hairline rounded-2xl p-6 border-amber-500/30 bg-amber-500/5 flex items-start gap-4 shadow-xl">
          <Clock className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-mist leading-relaxed">
            Your attendance is <strong className="text-amber-400 font-bold">{data.percentage}%</strong>. The minimum required is{' '}
            <strong className="text-amber-400 font-bold">75%</strong> to be eligible for examinations. Please attend regularly.
          </p>
        </div>
      )}

      {/* History table */}
      {data.records.length === 0 ? (
        <div className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
            <CalendarDays className="w-10 h-10 text-mist/50" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-parchment">No Records</h2>
            <p className="text-mist text-sm max-w-md mt-2 mx-auto">
              No attendance records found yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="surface-card border-hairline rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-[1fr_120px_1fr] gap-6 px-8 py-5 bg-surface border-b border-hairline text-[10px] font-bold text-veena-blue uppercase tracking-widest">
            <span>Date</span>
            <span className="text-center">Status</span>
            <span>Remarks</span>
          </div>
          <div className="divide-y divide-hairline max-h-[500px] overflow-y-auto styled-scroll">
            {data.records.map((r, i) => (
              <div key={r.id} className="ledger-row grid grid-cols-[1fr_120px_1fr] gap-6 px-8 py-5 items-center hover:bg-surface/50 transition-colors" style={{ animationDelay: `${i * 0.03}s` }}>
                <p className="text-sm text-parchment font-bold">
                  {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <div className="flex justify-center">
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-[10px] font-mono text-mist uppercase tracking-widest">{r.remarks || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
