'use client'

import { BookOpen, Clock, Calendar, User } from 'lucide-react'
import type { Homework } from '@/actions/homework-actions'

interface Props {
  homework: Homework[]
  role: 'student' | 'parent'
  classNameInfo?: string
}

export default function HomeworkViewer({ homework, role, classNameInfo }: Props) {
  if (homework.length === 0) {
    return (
      <div className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-inner">
        <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-mist/50" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-parchment">No Recent Homework</h2>
          <p className="text-mist text-sm max-w-sm mt-2 mx-auto">
            {role === 'student'
              ? 'You have no homework assigned in the last 7 days. Enjoy your free time!'
              : `No homework assigned in the last 7 days ${classNameInfo ? `for ${classNameInfo}` : ''}.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {homework.map((hw, i) => {
        const isPastDue = new Date(hw.due_date) < new Date(new Date().setHours(0, 0, 0, 0))
        
        return (
          <div key={hw.id} className="surface-card border-hairline rounded-[2rem] p-8 transition-transform hover:-translate-y-1 shadow-xl flex flex-col h-full" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex justify-between items-start mb-6 gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-veena-blue/10 text-veena-blue border border-veena-blue/20 mb-3 inline-block shadow-inner">
                  {hw.subject}
                </span>
                <h3 className="font-display text-xl font-bold text-parchment leading-tight">{hw.title}</h3>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border shadow-inner ${isPastDue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  <Clock className="w-3 h-3" />
                  Due: {new Date(hw.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            </div>

            <div className="prose prose-invert prose-sm max-w-none text-mist mb-8 flex-1 leading-relaxed">
              {hw.description}
            </div>

            <div className="mt-auto pt-6 border-t border-hairline flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-mist">
              <span className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-ink border border-hairline flex items-center justify-center">
                  <User className="w-3 h-3" />
                </div>
                {hw.teacher_info?.full_name || 'Teacher'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(hw.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
