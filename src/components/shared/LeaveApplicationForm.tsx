'use client'

import { useState, useTransition } from 'react'
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, Send, Loader2 } from 'lucide-react'
import { applyForLeave } from '@/actions/leave-actions'
import type { LeaveRequest, LeaveStatus } from '@/actions/leave-actions'
import DateInput from '@/components/shared/DateInput'

interface Props {
  pastLeaves: LeaveRequest[]
  roleName: 'Teacher' | 'Student'
}

export default function LeaveApplicationForm({ pastLeaves, roleName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Form State
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date.')
      return
    }

    startTransition(async () => {
      const res = await applyForLeave(startDate, endDate, reason)
      if (!res.success) {
        setError(res.error || 'Failed to submit leave application.')
      } else {
        setStartDate('')
        setEndDate('')
        setReason('')
        window.location.reload()
      }
    })
  }

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-inner"><Clock className="w-3.5 h-3.5" /> Pending</span>
      case 'approved':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-inner"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>
      case 'rejected':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-red-500/10 text-red-400 border-red-500/20 shadow-inner"><XCircle className="w-3.5 h-3.5" /> Rejected</span>
    }
  }

  const themeColor = roleName === 'Student' ? 'veena-blue' : 'veena-blue' // Use default veena-blue or pass color via props in future

  return (
    <div className="space-y-10">
      {/* ── Apply Form ── */}
      <div className="surface-card border-hairline rounded-[2rem] p-8 md:p-10 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-hairline pb-6">
          <div className="w-12 h-12 rounded-full bg-veena-blue/10 border border-veena-blue/20 flex items-center justify-center text-veena-blue shadow-inner">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-parchment">Apply for Leave</h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-mist mt-1">Submit a leave request for admin approval.</p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono shadow-inner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <DateInput
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                required
                labelClass="text-[10px] font-mono text-mist uppercase tracking-widest ml-1"
              />
            </div>
            <div className="space-y-2">
              <DateInput
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                required
                labelClass="text-[10px] font-mono text-mist uppercase tracking-widest ml-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-mist uppercase tracking-widest ml-1">Reason for Leave</label>
            <textarea
              required
              rows={4}
              placeholder="Please provide a clear reason for your leave request..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-surface border border-hairline rounded-xl px-4 py-3 text-sm text-parchment focus:outline-none focus:border-veena-blue transition-colors shadow-inner resize-y leading-relaxed"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3 rounded-xl bg-veena-blue text-ink font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#5C94FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Application
            </button>
          </div>
        </form>
      </div>

      {/* ── Past Applications ── */}
      <div className="space-y-6">
        <h3 className="font-display text-2xl font-bold text-parchment px-2">Your Leave History</h3>
        
        {pastLeaves.length === 0 ? (
          <div className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
              <CalendarIcon className="w-10 h-10 text-mist/50" />
            </div>
            <p className="text-mist font-mono uppercase tracking-widest text-xs">You haven't submitted any leave requests yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pastLeaves.map((leave, i) => (
              <div key={leave.id} className="surface-card border-hairline rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 transition-transform hover:-translate-y-1 shadow-xl" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {getStatusBadge(leave.status)}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-parchment bg-ink border border-hairline px-4 py-1.5 rounded-full shadow-inner">
                      {new Date(leave.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} 
                      {' '}to{' '} 
                      {new Date(leave.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-mist text-sm leading-relaxed">{leave.reason}</p>
                </div>
                
                <div className="md:border-l border-hairline md:pl-8 flex flex-col justify-center shrink-0">
                  <p className="text-[10px] text-mist font-bold uppercase tracking-widest mb-2">Applied On</p>
                  <p className="text-sm font-bold text-parchment bg-ink border border-hairline px-4 py-2 rounded-xl shadow-inner">
                    {new Date(leave.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
