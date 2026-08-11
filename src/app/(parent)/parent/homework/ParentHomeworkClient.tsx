'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import type { Homework } from '@/actions/homework-actions'
import type { ChildInfo } from '@/actions/portal-actions'
import HomeworkViewer from '@/components/shared/HomeworkViewer'

interface Props {
  childrenData: ChildInfo[]
  homeworkData: Homework[]
  defaultId?: string
}

export default function ParentHomeworkClient({ childrenData, homeworkData, defaultId }: Props) {
  const defaultChild = childrenData.find(c => c.studentRowId === defaultId) || childrenData[0]
  const [activeChild, setActiveChild] = useState<ChildInfo>(defaultChild)

  if (!activeChild) return null

  // Filter homework for the currently selected child's class
  const childHomework = homeworkData.filter((hw) => 
    hw.class_info?.class_name === activeChild.className && 
    hw.class_info?.section === activeChild.section
  )

  return (
    <div className="space-y-8">
      {/* ── Tabs ── */}
      {childrenData.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {childrenData.map(child => (
            <button
              key={child.studentRowId}
              onClick={() => setActiveChild(child)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeChild.studentRowId === child.studentRowId
                  ? 'bg-gold text-ink shadow-lg scale-105'
                  : 'bg-surface border border-hairline text-mist hover:text-gold hover:border-gold/50'
              }`}
            >
              {child.fullName}
            </button>
          ))}
        </div>
      )}

      {/* ── Active Child Info Header ── */}
      <div className="surface-card border-hairline rounded-2xl p-6 flex flex-wrap items-center gap-5 justify-between border-l-[6px] border-l-gold shadow-lg">
        <div>
          <h2 className="font-display text-2xl font-bold text-parchment">{activeChild.fullName}'s Homework</h2>
          <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-1">Class {activeChild.className} — Sec {activeChild.section}</p>
        </div>
      </div>

      {/* ── Homework Viewer ── */}
      <div className="surface-card border-hairline rounded-3xl p-6 shadow-2xl">
        <HomeworkViewer 
          homework={childHomework} 
          role="parent" 
          classNameInfo={`${activeChild.className} Sec ${activeChild.section}`} 
        />
      </div>
    </div>
  )
}
