'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, CalendarClock, Loader2, User } from 'lucide-react'
import { updateLeaveStatus } from '@/actions/leave-actions'
import type { LeaveRequest, LeaveStatus } from '@/actions/leave-actions'

interface Props {
  initialLeaves: LeaveRequest[]
}

export default function AdminLeavesClient({ initialLeaves }: Props) {
  const [leaves, setLeaves] = useState(initialLeaves)
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)

  const handleStatusUpdate = async (id: string, status: LeaveStatus) => {
    if (!confirm(`Are you sure you want to ${status} this leave request?`)) return
    setActionId(id)
    startTransition(async () => {
      const res = await updateLeaveStatus(id, status)
      if (!res.success) {
        alert(res.error || 'Failed to update leave status.')
      } else {
        setLeaves(prev => prev.filter(l => l.id !== id))
      }
      setActionId(null)
    })
  }

  if (leaves.length === 0) {
    return (
      <div className="surface-card rounded-3xl p-16 text-center mt-6 border border-hairline">
        <CheckCircle2 className="w-16 h-16 text-emerald-400/40 mx-auto mb-4" />
        <h3 className="font-display text-xl font-bold text-parchment mb-2">All Caught Up!</h3>
        <p className="text-mist">There are no pending leave requests at the moment.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2 mt-6">
      {leaves.map((leave) => {
        const isActioning = isPending && actionId === leave.id
        const roleColor = leave.role === 'teacher' ? 'text-veena-blue border-veena-blue/30' : 'text-coral border-coral/30'
        const roleBg = leave.role === 'teacher' ? 'rgba(62,92,118,0.1)' : 'rgba(241,145,125,0.08)'

        return (
          <div key={leave.id} className="surface-card border border-hairline rounded-2xl p-5 flex flex-col justify-between hover:border-coral/20 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${roleColor}`}
                    style={{ background: roleBg }}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-parchment text-base leading-tight">
                      {leave.profiles?.full_name || 'Unknown User'}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${roleColor}`}>
                      {leave.role}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end text-sm font-semibold text-parchment">
                    <CalendarClock className="w-4 h-4 text-gold" />
                    {new Date(leave.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {' – '}
                    {new Date(leave.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                  <p className="text-xs text-mist mt-1">
                    Applied: {new Date(leave.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="bg-ink/60 rounded-xl p-4 mb-5 border border-hairline">
                <p className="text-sm text-mist leading-relaxed italic">
                  &ldquo;{leave.reason}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-auto border-t border-hairline pt-4">
              <button
                onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => handleStatusUpdate(leave.id, 'approved')}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              >
                {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
