'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  IndianRupee,
  CheckCircle2,
  Calendar,
  CreditCard,
  FileText,
  Download,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import type { TeacherPaymentReceiptItem } from '@/actions/receipt-actions'
import TeacherPaymentModal from '@/components/shared/TeacherPaymentModal'
import { downloadTeacherPaymentPDF } from '@/utils/download-receipt-pdf'
import { numberToWords } from '@/utils/number-to-words'
import type { TeacherPaymentData } from '@/components/pdf/TeacherPaymentPdf'

interface Props {
  initialPayments: TeacherPaymentReceiptItem[]
  teacherInfo: {
    teacherId: string
    teacherCode: string
    teacherName: string
    qualification: string
  }
  error?: string
}

export default function TeacherPaymentsClient({ initialPayments, teacherInfo, error }: Props) {
  const [payments] = useState<TeacherPaymentReceiptItem[]>(initialPayments)
  const [selectedVoucher, setSelectedVoucher] = useState<TeacherPaymentData | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const totalAmount = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const latestPayment = payments[0]?.payment_date || '—'

  function buildVoucherData(item: TeacherPaymentReceiptItem): TeacherPaymentData {
    const amt = Number(item.amount) || 0
    return {
      voucherNo: `RMSPS/PAY/${new Date().getFullYear()}/${item.id.substring(0, 6).toUpperCase()}`,
      paymentDate: item.payment_date,
      teacherName: teacherInfo.teacherName,
      teacherId: teacherInfo.teacherCode,
      qualification: teacherInfo.qualification,
      amount: amt,
      amountInWords: numberToWords(amt),
      status: 'paid',
      remarks: item.remarks || undefined,
    }
  }

  async function handleDirectDownload(item: TeacherPaymentReceiptItem) {
    const data = buildVoucherData(item)
    setDownloadingId(item.id)
    try {
      await downloadTeacherPaymentPDF(data)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header Banner ── */}
      <div className="surface-card border-hairline rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner flex-shrink-0">
            <IndianRupee className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-parchment">
              Salary & Compensation Advice
            </h1>
            <p className="text-mist text-xs sm:text-sm mt-1">
              View your monthly salary disbursements, official payment advice slips, and vouchers.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end text-xs font-mono text-mist bg-surface/60 p-4 rounded-2xl border border-hairline">
          <div>
            Faculty: <span className="text-parchment font-bold">{teacherInfo.teacherName}</span>
          </div>
          <div className="mt-1">
            Emp Code: <span className="text-gold font-bold">{teacherInfo.teacherCode}</span>
          </div>
          <div className="mt-0.5">
            Role: <span className="text-parchment">{teacherInfo.qualification}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="surface-card border border-red-500/30 bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="surface-card border-hairline rounded-[2rem] p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 border shadow-inner bg-emerald-500/10 border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="font-display text-4xl font-black drop-shadow-md text-emerald-400">
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-3">
            Total Disbursed
          </p>
        </div>

        <div className="surface-card border-hairline rounded-[2rem] p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 border shadow-inner bg-veena-blue/10 border-veena-blue/20">
            <CreditCard className="w-6 h-6 text-veena-blue" />
          </div>
          <p className="font-display text-4xl font-black drop-shadow-md text-parchment">
            {payments.length}
          </p>
          <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-3">
            Total Payment Slips
          </p>
        </div>

        <div className="surface-card border-hairline rounded-[2rem] p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 border shadow-inner bg-gold/10 border-gold/20">
            <Calendar className="w-6 h-6 text-gold" />
          </div>
          <p className="font-display text-2xl font-bold drop-shadow-md text-parchment mt-2">
            {latestPayment !== '—'
              ? new Date(latestPayment).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </p>
          <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-3">
            Latest Disbursement
          </p>
        </div>
      </div>

      {/* ── Payments Vouchers Table ── */}
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
              Payment Vouchers & Slips
            </h2>
          </div>
          <span className="text-xs text-mist font-mono">
            {payments.length} Voucher{payments.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="divide-y divide-hairline">
          {payments.length === 0 ? (
            <div className="p-16 text-center">
              <CreditCard className="w-12 h-12 text-mist/30 mx-auto mb-3" />
              <p className="text-mist font-mono uppercase tracking-widest text-xs">
                No payment vouchers found for your account.
              </p>
            </div>
          ) : (
            payments.map((item, i) => {
              const voucherNo = `RMSPS/PAY/${new Date().getFullYear()}/${item.id.substring(0, 6).toUpperCase()}`
              return (
                <div
                  key={item.id}
                  className="ledger-row p-4 sm:px-8 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 hover:bg-surface/50 transition-colors"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface border border-hairline flex items-center justify-center flex-shrink-0 shadow-inner">
                        <CreditCard className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0 sm:hidden">
                        <p className="text-sm font-bold text-parchment font-mono">{voucherNo}</p>
                        <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-0.5">
                          {new Date(item.payment_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="sm:hidden flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Credited
                    </span>
                  </div>

                  {/* Desktop Voucher & Date */}
                  <div className="hidden sm:block flex-1 min-w-0">
                    <p className="text-base font-bold text-parchment font-mono">{voucherNo}</p>
                    <p className="text-[10px] font-mono text-mist uppercase tracking-widest mt-1">
                      Disbursed:{' '}
                      {new Date(item.payment_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {item.remarks ? ` • ${item.remarks}` : ''}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between sm:block sm:text-right sm:mr-2 pt-2 sm:pt-0 border-t border-hairline/50 sm:border-0">
                    <span className="sm:hidden text-xs text-mist font-mono uppercase tracking-wider">
                      Net Disbursed
                    </span>
                    <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono drop-shadow-sm text-right">
                      ₹{Number(item.amount).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Desktop status pill */}
                  <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Credited
                  </span>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-hairline/50 sm:border-0 justify-end">
                    <button
                      onClick={() => setSelectedVoucher(buildVoucherData(item))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-hairline text-xs font-semibold text-mist hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
                      title="Preview Official Advice Slip"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleDirectDownload(item)}
                      disabled={downloadingId === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold text-ink font-semibold text-xs hover:bg-[#E5C17B] transition-colors cursor-pointer disabled:opacity-50 shadow-sm flex-shrink-0"
                      title="Download Voucher PDF"
                    >
                      {downloadingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Download</span>
                    </button>
                  </div>
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
            <strong className="text-parchment font-bold">Finance & Accounts Bureau</strong>
          </p>
          <p className="text-xs">
            Direct credit is processed in accordance with your employment agreement. For salary certificate or tax deduction inquiries, connect with school administration.
          </p>
        </div>
      </div>

      {/* ── Voucher Preview Modal ── */}
      {selectedVoucher && (
        <TeacherPaymentModal data={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}
    </div>
  )
}
