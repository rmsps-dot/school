import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { fetchPublicNotice } from '@/actions/notice-actions'
import { PublicNoticeClient } from '@/components/notice/PublicNoticeClient'
import { Calendar, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: notice } = await fetchPublicNotice(id)

  if (!notice) {
    return {
      title: 'Notice Not Found | RMSPS',
      description: 'Official notice from Residential Maa Saraswati Public School.',
    }
  }

  return {
    title: `${notice.title} | RMSPS Official Notice`,
    description: notice.content.slice(0, 160),
    openGraph: {
      title: `${notice.title} | RMSPS Official Notice`,
      description: notice.content.slice(0, 160),
      siteName: 'Residential Maa Saraswati Public School',
    },
  }
}

export default async function PublicNoticePage({ params }: Props) {
  const { id } = await params
  const { data: notice, error } = await fetchPublicNotice(id)

  if (!notice || error) {
    return (
      <div className="min-h-screen bg-[#070709] text-parchment flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#101015] rounded-2xl p-8 border border-white/10 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-parchment mb-2">Notice Not Found</h2>
          <p className="text-sm text-mist leading-relaxed mb-6">
            This notice may have expired or the link is invalid.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold text-ink bg-coral hover:bg-coral/90 transition-all shadow-lg"
          >
            Visit School Website
          </Link>
        </div>
      </div>
    )
  }

  const formattedDate = new Date(notice.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#070709] text-parchment flex flex-col justify-center py-6 sm:py-12 px-3 sm:px-6 print:p-0 print:bg-white print:text-black">
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Minimalist Aesthetic Notice Card */}
        <div className="bg-[#101015] border border-white/[0.08] rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:bg-white print:p-2">
          
          {/* Subtle Golden Accent Bar */}
          <div className="print:hidden absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-veena-blue via-gold to-coral opacity-80" />

          {/* 1. Clean Header: School Logo + Name + Date */}
          <div className="flex items-center gap-3.5 pb-6 border-b border-white/[0.08] print:border-b print:border-black">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/15 bg-black/40 shrink-0 shadow-md">
              <Image
                src="/icon-192.png"
                alt="RMSPS Logo"
                width={48}
                height={48}
                priority
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-parchment print:text-black truncate tracking-tight">
                Residential Maa Saraswati Public School
              </h1>
              <div className="flex items-center gap-2 text-xs text-mist print:text-gray-600 mt-0.5">
                <span className="text-gold/90 font-medium">Official Notice</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3 h-3 text-mist print:hidden" />
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Notice Title & Content (Pure Focus) */}
          <div className="py-6 sm:py-8 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-parchment print:text-black tracking-tight leading-snug">
              {notice.title}
            </h2>

            <div className="text-sm sm:text-base leading-relaxed text-parchment/90 print:text-gray-900 font-sans whitespace-pre-wrap select-text">
              {notice.content}
            </div>
          </div>

          {/* 3. Clean Minimal Actions (Share, Save PDF / Print) */}
          <PublicNoticeClient />

        </div>

        {/* Discreet School Footer */}
        <p className="text-center text-[11px] text-mist/40 mt-6 print:hidden">
          RMSPS • Pipra, Supaul, Bihar
        </p>

      </div>
    </div>
  )
}
