'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Wallet,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ChevronRight,
  Loader2,
  FileText,
  Download,
} from 'lucide-react'
import { getStudentFees, type FeeRecord } from '@/actions/fee-actions'
import type { ChildInfo } from '@/actions/portal-actions'
import FeeReceiptModal from '@/components/shared/FeeReceiptModal'
import { downloadFeeReceiptPDF } from '@/utils/download-receipt-pdf'
import { numberToWords } from '@/utils/pdf-generator'
import type { FeeReceiptData } from '@/components/pdf/FeeReceiptPdf'

export default function ParentFeesClient({ children }: { children: ChildInfo[] }) {
  const [activeChildId, setActiveChildId] = useState(children[0]?.studentRowId)
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceiptData | null>(null)
  const [downloadingFeeId, setDownloadingFeeId] = useState<string | null>(null)

  const activeChild = children.find((c) => c.studentRowId === activeChildId)

  useEffect(() => {
    if (activeChild?.studentRowId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true)
      getStudentFees(activeChild.studentRowId).then((res) => {
        setFees(res.data || [])
        setLoading(false)
      })
    }
  }, [activeChild])

  const totalDue = fees
    .filter((f) => f.status === 'due')
    .reduce((s, f) => s + Number(f.amount) - Number(f.paid_amount), 0)
  const totalPaid = fees
    .filter((f) => f.status === 'paid' || Number(f.paid_amount) > 0)
    .reduce((s, f) => s + Number(f.paid_amount), 0)
  const totalPending = fees
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
      studentName: activeChild?.fullName || 'Student',
      studentId: activeChild?.studentCode || 'N/A',
      className: `${activeChild?.className || ''} ${activeChild?.section ? `Sec ${activeChild.section}` : ''}`.trim() || 'General Class',
      parentName: 'Parent / Guardian',
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
      {/* ── Children Tabs ── */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {children.map((child) => (
            <button
              key={child.studentRowId}
              onClick={() => setActiveChildId(child.studentRowId)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeChildId === child.studentRowId
                  ? 'bg-gold text-ink shadow-lg scale-105'
                  : 'bg-surface border border-hairline text-mist hover:text-gold hover:border-gold/50'
              }`}
            >
              {child.fullName}
            </button>
          ))}
        </div>
      )}

      {/* ── Coming soon banner ── */}
      <div className="surface-card border-hairline rounded-2xl p-5 border-veena-blue/30 flex items-start gap-4 shadow-xl">
        <ShieldCheck className="w-6 h-6 text-veena-blue flex-shrink-0" />
        <p className="text-sm text-mist leading-relaxed">
          <strong className="text-veena-blue font-bold">Online Payment coming soon.</strong>{' '}
          Razorpay integration will allow you to pay fees directly from this portal. Contact the
          school office to make payments in the meantime.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-mist font-mono text-[10px] uppercase tracking-widest">
            Loading fee records...
          </span>
        </div>
      ) : (
        <>
          {/* ── Summary cards ── */}
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
                label: 'Upcoming',
                amount: totalPending,
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

          {/* ── Fee ledger table ── */}
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
                  Fee Ledger & Receipts
                </h2>
              </div>
              <div className="text-xs text-mist">
                Student: <span className="font-bold text-parchment">{activeChild?.fullName}</span>
              </div>
            </div>

            <div className="divide-y divide-hairline">
              {fees.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="text-mist font-mono uppercase tracking-widest text-xs">
                    No fee records found for this student.
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
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>

            {/* Pay now CTA */}
            {totalDue > 0 && (
              <div className="p-4 sm:px-8 sm:py-6 bg-surface border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono text-mist uppercase tracking-widest mb-1">
                    Total amount due
                  </p>
                  <p className="text-2xl font-display font-black text-red-400">
                    ₹{totalDue.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  id="pay-now-btn"
                  disabled
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-ink bg-gold opacity-50 cursor-not-allowed shadow-lg"
                  title="Online payment coming soon"
                >
                  <Wallet className="w-4 h-4" />
                  Pay Now
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Contact info ── */}
      <div className="surface-card border-hairline rounded-2xl p-6 flex items-start gap-4 shadow-lg">
        <ShieldCheck className="w-6 h-6 text-mist flex-shrink-0" />
        <div className="text-sm text-mist space-y-2">
          <p>
            <strong className="text-parchment font-bold text-base">School Account Office</strong>
          </p>
          <p>For payment receipts or queries, contact the school office:</p>
          <p className="font-mono text-xs">📞 9546536279 &nbsp;|&nbsp; ✉ rmsps@admin.com</p>
          <p className="font-mono text-xs">🕐 Mon–Sat, 9:00 AM – 3:00 PM</p>
        </div>
      </div>

      {/* ── Receipt Preview Modal ── */}
      {selectedReceipt && (
        <FeeReceiptModal data={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  )
}
