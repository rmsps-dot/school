'use client'

import { useState, useTransition } from 'react'
import { Plus, BookOpen, Clock, Loader2, Calendar } from 'lucide-react'
import { createHomework } from '@/actions/homework-actions'
import type { Homework, ClassOption } from '@/actions/homework-actions'
import DateInput from '@/components/shared/DateInput'

interface Props {
  classes: ClassOption[]
  recentHomework: Homework[]
}

export default function TeacherHomeworkClient({ classes, recentHomework }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  
  // Form State
  const [classId, setClassId] = useState('')
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const res = await createHomework(classId, subject, title, description, dueDate)
      if (!res.success) {
        setError(res.error || 'Failed to assign homework.')
      } else {
        setClassId('')
        setSubject('')
        setTitle('')
        setDescription('')
        setDueDate('')
        // Refresh to fetch new homework list
        window.location.reload()
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Assign Form ── */}
      <div className="surface-card rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-veena-blue/20 flex items-center justify-center text-veena-blue">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-parchment font-display">Assign New Homework</h2>
            <p className="text-sm text-mist">Assign daily tasks to your classes.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-mist ml-1">Select Class</label>
              <select
                required
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="input-glass w-full appearance-none cursor-pointer"
              >
                <option value="" disabled>Choose a class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.class_name} — Sec {c.section}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-mist ml-1">Subject</label>
              <input
                required
                type="text"
                placeholder="e.g., Mathematics"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="input-glass w-full"
              />
            </div>
            <div className="space-y-1.5">
              <DateInput
                label="Due Date"
                value={dueDate}
                onChange={setDueDate}
                required
                labelClass="text-sm font-bold text-mist ml-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-mist ml-1">Task Title</label>
            <input
              required
              type="text"
              placeholder="e.g., Solve Algebra Exercise 3.2"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-glass w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-mist ml-1">Description / Instructions</label>
            <textarea
              required
              rows={3}
              placeholder="Provide detailed instructions..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-glass w-full resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || classes.length === 0}
            className="btn-primary py-2.5 px-6 rounded-xl flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Assign Homework
          </button>
        </form>
      </div>

      {/* ── Recent Homework ── */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-bold text-parchment px-2">Recently Assigned (Past 7 Days)</h3>
        
        {recentHomework.length === 0 ? (
          <div className="surface-card rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-mist/30 mx-auto mb-3" />
            <p className="text-mist text-sm">No homework assigned in the last 7 days.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recentHomework.map((hw) => (
              <div key={hw.id} className="surface-card rounded-2xl p-6 transition-all hover:bg-white/[0.04]">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-veena-blue/15 text-veena-blue mb-2 inline-block">
                      {hw.class_info?.class_name} {hw.class_info?.section}
                    </span>
                    <h4 className="text-base font-bold text-parchment leading-tight">{hw.title}</h4>
                    <p className="text-xs text-coral font-medium mt-1">{hw.subject}</p>
                  </div>
                  <div className="flex flex-col items-end text-xs font-medium text-mist whitespace-nowrap font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due: {new Date(hw.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-mist line-clamp-3">{hw.description}</p>
                <div className="mt-4 pt-4 border-t border-hairline flex justify-between items-center text-xs text-mist/70 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Assigned: {new Date(hw.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
