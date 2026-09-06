'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  FileText,
  Download,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import type { StudentProfile } from '@/actions/portal-actions'
import type { FeeRecord } from '@/actions/fee-actions'
import FeeReceiptModal from '@/components/shared/FeeReceiptModal'
import { downloadFeeReceiptPDF } from '@/utils/download-receipt-pdf'
import { numberToWords } from '@/utils/pdf-generator'
import type { FeeReceiptData } from '@/components/pdf/FeeReceiptPdf'

interface Props {
  profile: StudentProfile
  initialFees: FeeRecord[]
  error?: string
}

export default function StudentFeesClient({ profile, initialFees, error }: Props) {
  const [fees] = useState<FeeRecord[]>(initialFees)
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceiptData | null>(null)
  const [downloadingFeeId, setDownloadingFeeId] = useState<string | null>(null)

  const totalDue = fees
    .filter((f) => f.status === 'due')
    .reduce((s, f) => s + Number(f.amount) - Number(f.paid_amount), 0)
  const totalPaid = fees
    .filter((f) => f.status === 'paid' || Number(f.paid_amount) > 0)
    .reduce((s, f) => s + Number(f.paid_amount), 0)
  const totalUpcoming = fees
    .filter((f) => f.status === 'upcoming')
    .reduce((s, f) => s + Number(f.amount), 0)

  function buildReceiptData(fee: FeeRecord): FeeReceiptData {
    const paid = Number(fee.paid_amount) || 0
    const total = Number(fee.amount) || 0
    const balance = Math.max(0, total - paid)
    return {
      receiptNo: `RMSPS/REC/${new Date().getFullYear()}/${fee.id.substring(0, 6).toUpperCase()}`,
      date: fee.due_date ? fee.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      studentName: profile.fullName,
      studentId: profile.studentCode,
      className: `${profile.className} ${profile.section ? `Sec ${profile.section}` : ''}`.trim(),
      parentName: profile.fatherName || 'Parent / Guardian',
      feeName: fee.fee_name,
      totalAmount: total,
      paidAmount: paid,
      balanceAmount: balance,
      status: balance === 0 ? 'paid' : 'due',
      amountInWords: numberToWords(paid),
      paymentMode: 'School Accounts / Portal',
    }
  }

  async function handleDirectDownload(fee: FeeRecord) {
    const data = buildReceiptData(fee)
    setDownloadingFeeId(fee.id)
    try {
      await downloadFeeReceiptPDF(data)
    } finally {
      setDownloadingFeeId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header Banner ── */}
      <div className="surface-card border-hairline rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shadow-inner flex-shrink-0">
            <IndianRupee className="w-8 h-8 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-parchment">
              Fees & Official Receipts
            </h1>
            <p className="text-mist text-xs sm:text-sm mt-1">
              Track your fee breakdown, payment clearances, and download verified receipts.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end text-xs font-mono text-mist bg-surface/60 p-4 rounded-2xl border border-hairline">
          <div>
            Student: <span className="text-parchment font-bold">{profile.fullName}</span>
          </div>
          <div className="mt-1">
            Roll / ID: <span className="text-gold font-bold">{profile.studentCode}</span>
          </div>
          <div className="mt-0.5">
            Class: <span className="text-parchment">{profile.className} ({profile.section})</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="surface-card border border-red-500/30 bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: 'Total Paid',
            amount: totalPaid,
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            label: 'Due Now',
            amount: totalDue,
            icon: AlertCircle,
            color: 'text-red-400',
            bg: 'bg-red-500/10 border-red-500/20',
          },
          {
            label: 'Upcoming Fees',
            amount: totalUpcoming,
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
          },
        ].map(({ label, amount, icon: Icon, color, bg }, i) => (
          <div
            key={label}
            className="surface-card border-hairline rounded-[2rem] p-8 text-center shadow-xl transition-transform hover:-translate-y-1 hover:border-gold/30"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div
              className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 border shadow-inner ${bg}`}
            >
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <p className={`font-display text-4xl font-black drop-shadow-md ${color}`}>
              ₹{amount.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-3">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Fee Ledger Table ── */}
      <div className="surface-card border-hairline rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-5 bg-surface border-b border-hairline flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-ink border border-hairline flex-shrink-0">
              <Image
                src="/icon-192.png"
                alt="RMSPS Logo"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <h2 className="text-[10px] font-bold text-gold uppercase tracking-widest">
              Fee Records & Official Receipts
            </h2>
          </div>
          <span className="text-xs text-mist font-mono">
            {fees.length} Record{fees.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="divide-y divide-hairline">
          {fees.length === 0 ? (
            <div className="p-16 text-center">
              <CreditCard className="w-12 h-12 text-mist/30 mx-auto mb-3" />
              <p className="text-mist font-mono uppercase tracking-widest text-xs">
                No fee records found for your account.
              </p>
            </div>
          ) : (
            fees.map((fee, i) => {
              const statusMap: Record<
                string,
                { label: string; cls: string; Icon: React.ElementType }
              > = {
                paid: {
                  label: 'Paid',
                  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  Icon: CheckCircle2,
                },
                due: {
                  label: 'Due',
                  cls: 'bg-red-500/10 text-red-400 border-red-500/20',
                  Icon: AlertCircle,
                },
                upcoming: {
                  label: 'Upcoming',
                  cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  Icon: Clock,
                },
              }
              const st = statusMap[fee.status] || statusMap['due']
              const hasPaidRecord = Number(fee.paid_amount) > 0 || fee.status === 'paid'

              return (
                <div
                  key={fee.id}
                  className="ledger-row p-4 sm:px-8 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 hover:bg-surface/50 transition-colors"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface border border-hairline flex items-center justify-center flex-shrink-0 shadow-inner">
                        <CreditCard className="w-5 h-5 text-mist" />
                      </div>
                      <div className="min-w-0 sm:hidden">
                        <p className="text-sm font-bold text-parchment truncate">
                          {fee.fee_name}
                        </p>
                        <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-0.5">
                          Due:{' '}
                          {new Date(fee.due_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`sm:hidden flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex-shrink-0 ${st.cls}`}
                    >
                      <st.Icon className="w-3.5 h-3.5" />
                      {st.label}
                    </span>
                  </div>

                  {/* Desktop name container */}
                  <div className="hidden sm:block flex-1 min-w-0">
                    <p className="text-base font-bold text-parchment">{fee.fee_name}</p>
                    <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-1">
                      Due:{' '}
                      {new Date(fee.due_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between sm:block sm:text-right sm:mr-2 pt-2 sm:pt-0 border-t border-hairline/50 sm:border-0">
                    <span className="sm:hidden text-xs text-mist font-mono uppercase tracking-wider">
                      Fee Amount
                    </span>
                    <div>
                      <p className="text-base sm:text-lg font-bold text-parchment drop-shadow-sm text-right">
                        ₹{Number(fee.amount).toLocaleString('en-IN')}
                      </p>
                      {Number(fee.paid_amount) > 0 && (
                        <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mt-0.5 sm:mt-1 text-right">
                          Paid ₹{Number(fee.paid_amount).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Desktop status pill */}
                  <span
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex-shrink-0 ${st.cls}`}
                  >
                    <st.Icon className="w-3.5 h-3.5" />
                    {st.label}
                  </span>

                  {/* Receipt Action Buttons */}
                  {hasPaidRecord ? (
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-hairline/50 sm:border-0 justify-end">
                      <button
                        onClick={() => setSelectedReceipt(buildReceiptData(fee))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-hairline text-xs font-semibold text-mist hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
                        title="Preview Official Receipt"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleDirectDownload(fee)}
                        disabled={downloadingFeeId === fee.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/30 text-xs font-semibold text-gold hover:bg-gold/20 transition-colors cursor-pointer disabled:opacity-50"
                        title="Download Receipt PDF"
                      >
                        {downloadingFeeId === fee.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-[11px] text-mist/60 font-mono py-1 sm:py-0">
                      Payment Pending
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Help / Contact Notice ── */}
      <div className="surface-card border-hairline rounded-2xl p-6 flex items-start gap-4 shadow-lg">
        <ShieldCheck className="w-6 h-6 text-mist flex-shrink-0" />
        <div className="text-sm text-mist space-y-1">
          <p>
            <strong className="text-parchment font-bold">Accounts Helpdesk</strong>
          </p>
          <p className="text-xs">
            For fee receipts, clearance certificates, or scholarship questions, contact the school accounts desk during working hours (9:00 AM – 3:00 PM).
          </p>
        </div>
      </div>

      {/* ── Receipt Preview Modal ── */}
      {selectedReceipt && (
        <FeeReceiptModal data={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  )
}
