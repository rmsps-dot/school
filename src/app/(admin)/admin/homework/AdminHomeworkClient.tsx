'use client'

import { useState } from 'react'
import { BookOpen, Clock, Calendar, UserCircle, Filter } from 'lucide-react'
import type { Homework } from '@/actions/homework-actions'

interface Props {
  initialHomework: Homework[]
}

export default function AdminHomeworkClient({ initialHomework }: Props) {
  const [filterClass, setFilterClass] = useState<string>('all')

  // Get unique classes from homework history for the filter
  const classes = Array.from(new Set(initialHomework.map(h => h.class_id))).map(classId => {
    const hw = initialHomework.find(h => h.class_id === classId)
    return {
      id: classId,
      name: `Class ${hw?.class_info?.class_name} - ${hw?.class_info?.section}`
    }
  })

  const filteredHomework = filterClass === 'all' 
    ? initialHomework 
    : initialHomework.filter(hw => hw.class_id === filterClass)

  return (
    <div className="space-y-6 pb-20">
      
      {/* ── Filters ── */}
      <div className="glass rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-coral font-bold">
          <Filter className="w-5 h-5" /> Filter by Class:
        </div>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="input-glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-coral w-full md:w-64 cursor-pointer"
        >
          <option value="all">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* ── Homework Grid ── */}
      {filteredHomework.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-hairline">
          <BookOpen className="w-16 h-16 text-mist mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">No Homework Found</h2>
          <p className="text-mist mt-2">No homework was assigned in the last 7 days for the selected criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredHomework.map((hw) => (
            <div key={hw.id} className="glass rounded-2xl p-6 border border-hairline relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4 gap-2 relative z-10">
                <div>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 mb-3 inline-block">
                    {hw.class_info?.class_name} - {hw.class_info?.section}
                  </span>
                  <h4 className="text-lg font-bold text-white leading-tight">{hw.title}</h4>
                  <p className="text-sm text-sky-400 font-medium mt-1">{hw.subject}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-parchment line-clamp-4">{hw.description}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-hairline space-y-2 relative z-10">
                <div className="flex justify-between items-center text-xs text-mist font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-mist" /> Assigned: {new Date(hw.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                    <Clock className="w-3.5 h-3.5" /> Due: {new Date(hw.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 text-xs font-bold text-coral">
                  <UserCircle className="w-4 h-4 text-coral" />
                  Assigned by: {hw.teacher_info?.full_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
