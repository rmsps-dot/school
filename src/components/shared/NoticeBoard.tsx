'use client'

import { Bell, Calendar, Users } from 'lucide-react'
import type { Notice } from '@/actions/notice-actions'

interface Props {
  notices: Notice[]
  roleName: string
}

export default function NoticeBoard({ notices, roleName }: Props) {
  if (notices.length === 0) {
    return (
      <div className="surface-card border-hairline rounded-[2rem] p-16 flex flex-col items-center gap-6 text-center shadow-inner">
        <div className="w-20 h-20 rounded-full bg-ink border border-hairline flex items-center justify-center">
          <Bell className="w-10 h-10 text-mist/50" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-parchment">No Notices</h2>
          <p className="text-mist text-sm max-w-sm mt-2 mx-auto">
            There are no active notices or circulars for {roleName}s at this time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {notices.map((notice, i) => {
        // Aesthetic coloring based on target role
        let roleColor = 'text-parchment'
        let bgTag = 'bg-surface border-hairline'
        
        if (notice.target_role === 'student') { roleColor = 'text-veena-blue'; bgTag = 'bg-veena-blue/10 border-veena-blue/20' }
        if (notice.target_role === 'teacher') { roleColor = 'text-violet-400'; bgTag = 'bg-violet-500/10 border-violet-500/20' }
        if (notice.target_role === 'parent')  { roleColor = 'text-gold'; bgTag = 'bg-gold/10 border-gold/20' }

        return (
          <div key={notice.id} className="surface-card border-hairline rounded-[2rem] p-8 transition-transform hover:-translate-y-1 shadow-xl" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 border-b border-hairline pb-6">
              <h3 className="font-display text-xl font-bold text-parchment leading-tight">{notice.title}</h3>
              
              <div className="flex items-center gap-3 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest">
                {/* Target Role Tag */}
                <span className={`px-3 py-1 rounded-full border shadow-inner ${bgTag} ${roleColor}`}>
                  {notice.target_role === 'all' ? 'Everyone' : notice.target_role + 's'}
                </span>
                {/* Date Tag */}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink border border-hairline text-mist shadow-inner">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(notice.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="prose prose-invert prose-sm max-w-none text-mist whitespace-pre-wrap leading-relaxed">
              {notice.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
