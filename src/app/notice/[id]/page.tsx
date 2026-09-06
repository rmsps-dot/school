import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchPublicNotice } from '@/actions/notice-actions'
import { PublicNoticeClient } from '@/components/notice/PublicNoticeClient'
import { FileText, Calendar, Users, ShieldCheck, AlertTriangle } from 'lucide-react'

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
    title: `${notice.title} — Official Circular | RMSPS`,
    description: notice.content.slice(0, 160),
    openGraph: {
      title: `${notice.title} — Official Circular | RMSPS`,
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
      <div className="min-h-screen bg-ink text-parchment flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-hairline text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-bold text-parchment mb-2">Notice Not Found</h2>
          <p className="text-sm text-mist leading-relaxed mb-6">
            This notice may have expired, been updated, or the link is invalid.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-xs font-bold text-ink bg-coral hover:bg-coral/90 transition-all shadow-lg"
          >
            Visit School Website
          </Link>
        </div>
      </div>
    )
  }

  const issueDate = new Date(notice.created_at).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const roleLabelMap: Record<string, string> = {
    all: 'ALL STUDENTS, PARENTS & FACULTY',
    parent: 'ALL PARENTS & GUARDIANS',
    student: 'ALL STUDENTS',
    teacher: 'TEACHING FACULTY & STAFF',
  }
  const audienceLabel = roleLabelMap[notice.target_role] || notice.target_role.toUpperCase()

  return (
    <div className="min-h-screen bg-[#07070A] text-parchment py-6 sm:py-12 px-3 sm:px-6 print:p-0 print:bg-white print:text-black">
      <div className="max-w-3xl mx-auto">
        
        {/* ── Official Institutional Circular Card ── */}
        <div className="glass-panel rounded-3xl border border-hairline p-6 sm:p-10 shadow-2xl bg-ink/90 backdrop-blur-xl relative overflow-hidden print:border-none print:shadow-none print:bg-white print:p-4">
          
          {/* Subtle Top Decorative Accent */}
          <div className="print:hidden absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-veena-blue via-gold to-coral" />

          {/* ══════════════════════════════════════════════════════════════
              1. OFFICIAL LETTERHEAD (INSTITUTION DETAILS)
             ══════════════════════════════════════════════════════════════ */}
          <div className="text-center pb-6 border-b border-hairline print:border-b-2 print:border-black">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mx-auto mb-3.5 border-2 border-gold/40 shadow-xl bg-ink flex items-center justify-center">
              <Image
                src="/icon-192.png"
                alt="RMSPS School Logo"
                width={80}
                height={80}
                priority
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-lg sm:text-2xl font-display font-extrabold text-parchment print:text-black tracking-wide uppercase leading-tight">
              Residential Maa Saraswati Public School
            </h1>
            
            <p className="text-xs sm:text-sm font-semibold text-gold print:text-gray-800 mt-1 uppercase tracking-wider">
              Senior Secondary Day-cum-Residential School
            </p>
            
            <p className="text-[11px] sm:text-xs text-mist print:text-gray-600 mt-1">
              Govt Reg: <strong className="text-parchment print:text-black">PSS217/19</strong> • UDISE Code: <strong className="text-parchment print:text-black">10060603629</strong>
            </p>
            
            <p className="text-[11px] sm:text-xs text-mist print:text-gray-600 mt-0.5">
              Campus: Kating Chowk, Maheshpur road, Pipra, Supaul, Bihar - 852109
            </p>

            <p className="text-[11px] text-mist print:text-gray-600 mt-0.5">
              Helpline: +91 95465 36279 • Email: srzsurazzrajput@gmail.com
            </p>

            {/* Circular Category Pill */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-veena-blue/15 border border-veena-blue/30 text-veena-blue print:border-black print:text-black print:bg-gray-100 text-xs font-bold uppercase tracking-widest mt-4">
              <FileText className="w-3.5 h-3.5" />
              <span>Official Institutional Circular</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              2. METADATA BAR (REF NO, DATE, TARGET AUDIENCE)
             ══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 border-b border-hairline text-xs print:border-b print:border-black print:py-2">
            <div>
              <span className="text-mist print:text-gray-600 uppercase tracking-wider text-[10px] font-semibold block">Circular Reference</span>
              <span className="font-mono font-bold text-parchment print:text-black mt-0.5 block">
                RMSPS/CIR/{notice.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <div>
              <span className="text-mist print:text-gray-600 uppercase tracking-wider text-[10px] font-semibold block">Issue Date</span>
              <span className="font-medium text-parchment print:text-black mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gold print:hidden" />
                {issueDate}
              </span>
            </div>

            <div>
              <span className="text-mist print:text-gray-600 uppercase tracking-wider text-[10px] font-semibold block">Circulated To</span>
              <span className="font-bold text-coral print:text-black mt-0.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 print:hidden" />
                {audienceLabel}
              </span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              3. NOTICE TITLE & BODY CONTENT
             ══════════════════════════════════════════════════════════════ */}
          <div className="py-6 sm:py-8 space-y-6">
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-parchment print:text-black tracking-tight leading-snug">
              {notice.title}
            </h2>

            <div className="text-sm sm:text-base leading-relaxed text-parchment/90 print:text-gray-900 whitespace-pre-wrap font-sans bg-white/[0.015] print:bg-white p-4 sm:p-6 rounded-2xl border border-hairline/60 print:border-none print:p-0">
              {notice.content}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              4. OFFICIAL SIGN-OFF & VERIFICATION BLOCK
             ══════════════════════════════════════════════════════════════ */}
          <div className="pt-6 border-t border-hairline print:border-t print:border-black flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            {/* Digital Verification Seal */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 print:border-gray-400 print:text-black print:bg-gray-50">
              <ShieldCheck className="w-5 h-5 text-emerald-400 print:text-black shrink-0" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[11px]">Official School Circular</p>
                <p className="text-[10px] text-mist print:text-gray-600">Digitally authenticated by RMSPS Administrative Desk</p>
              </div>
            </div>

            {/* Signature Block */}
            <div className="text-right sm:text-right w-full sm:w-auto">
              <p className="font-mono text-xs text-mist print:text-gray-600">[Sd/-]</p>
              <p className="font-bold text-sm text-parchment print:text-black mt-0.5">
                Office of Administration & Principal
              </p>
              <p className="text-xs text-mist print:text-gray-600">
                Residential Maa Saraswati Public School, Pipra
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              5. INTERACTIVE CLIENT BUTTONS (PRINT, SHARE, PORTAL)
             ══════════════════════════════════════════════════════════════ */}
          <PublicNoticeClient />

        </div>

      </div>
    </div>
  )
}
