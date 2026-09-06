'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  GraduationCap,
  UserCheck,
  Search,
  Filter,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  Calendar,
  IndianRupee,
} from 'lucide-react'
import type { StudentFeeReceiptItem, TeacherPaymentReceiptItem } from '@/actions/receipt-actions'
import type { SchoolClass } from '@/actions/class-actions'
import FeeReceiptModal from '@/components/shared/FeeReceiptModal'
import TeacherPaymentModal from '@/components/shared/TeacherPaymentModal'
import { downloadFeeReceiptPDF, downloadTeacherPaymentPDF } from '@/utils/download-receipt-pdf'
import { numberToWords } from '@/utils/pdf-generator'
import type { FeeReceiptData } from '@/components/pdf/FeeReceiptPdf'
import type { TeacherPaymentData } from '@/components/pdf/TeacherPaymentPdf'

interface Props {
  studentReceipts: StudentFeeReceiptItem[]
  teacherPayments: TeacherPaymentReceiptItem[]
  classes: SchoolClass[]
}

export default function AdminReceiptsClient({
  studentReceipts,
  teacherPayments,
  classes,
}: Props) {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students')

  // Student Filter States
  const [selectedClassId, setSelectedClassId] = useState<string>('all')
  const [studentSearch, setStudentSearch] = useState<string>('')

  // Teacher Filter States
  const [teacherSearch, setTeacherSearch] = useState<string>('')

  // Modal & Download States
  const [selectedStudentReceipt, setSelectedStudentReceipt] = useState<FeeReceiptData | null>(null)
  const [selectedTeacherVoucher, setSelectedTeacherVoucher] = useState<TeacherPaymentData | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // 1. Filtered Student Fee Receipts
  const filteredStudentReceipts = useMemo(() => {
    return studentReceipts.filter((item) => {
      // Class filter: default 'all' shows everything!
      if (selectedClassId !== 'all') {
        if (item.class_id !== selectedClassId) {
          return false
        }
      }

      // Search filter: Student name, admission ID, or fee name
      if (studentSearch.trim()) {
        const query = studentSearch.toLowerCase().trim()
        const matchName = item.student_name.toLowerCase().includes(query)
        const matchId = item.student_id.toLowerCase().includes(query)
        const matchFee = item.fee_name.toLowerCase().includes(query)
        if (!matchName && !matchId && !matchFee) return false
      }

      return true
    })
  }, [studentReceipts, selectedClassId, studentSearch])

  // 2. Filtered Teacher Payments (Case-Insensitive name search)
  const filteredTeacherPayments = useMemo(() => {
    return teacherPayments.filter((item) => {
      if (!teacherSearch.trim()) return true
      const query = teacherSearch.toLowerCase().trim()
      const matchName = (item.teacher_name || '').toLowerCase().includes(query)
      const matchCode = (item.teacher_code || '').toLowerCase().includes(query)
      const matchRemarks = (item.remarks || '').toLowerCase().includes(query)
      return matchName || matchCode || matchRemarks
    })
  }, [teacherPayments, teacherSearch])

  // Helpers to construct PDF data
  function buildStudentReceiptData(item: StudentFeeReceiptItem): FeeReceiptData {
    const paid = Number(item.paid_amount) || 0
    const total = Number(item.amount) || 0
    const balance = Math.max(0, total - paid)
    return {
      receiptNo: `RMSPS/REC/${new Date().getFullYear()}/${item.id.substring(0, 6).toUpperCase()}`,
      date: item.due_date ? item.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      studentName: item.student_name,
      studentId: item.student_id,
      className: `${item.class_name} ${item.section ? `Sec ${item.section}` : ''}`.trim(),
      parentName: item.father_name || 'Parent / Guardian',
      feeName: item.fee_name,
      totalAmount: total,
      paidAmount: paid,
      balanceAmount: balance,
      status: balance === 0 ? 'paid' : 'due',
      amountInWords: numberToWords(paid),
      paymentMode: 'School Accounts / Portal',
    }
  }

  function buildTeacherVoucherData(item: TeacherPaymentReceiptItem): TeacherPaymentData {
    const amt = Number(item.amount) || 0
    return {
      voucherNo: `RMSPS/PAY/${new Date().getFullYear()}/${item.id.substring(0, 6).toUpperCase()}`,
      paymentDate: item.payment_date,
      teacherName: item.teacher_name,
      teacherId: item.teacher_code,
      qualification: item.qualification,
      amount: amt,
      amountInWords: numberToWords(amt),
      status: 'paid',
      remarks: item.remarks || undefined,
    }
  }

  async function handleDownloadStudentReceipt(item: StudentFeeReceiptItem) {
    const data = buildStudentReceiptData(item)
    setDownloadingId(`stu-${item.id}`)
    try {
      await downloadFeeReceiptPDF(data)
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDownloadTeacherVoucher(item: TeacherPaymentReceiptItem) {
    const data = buildTeacherVoucherData(item)
    setDownloadingId(`tea-${item.id}`)
    try {
      await downloadTeacherPaymentPDF(data)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="surface-card border-hairline rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shadow-inner flex-shrink-0">
            <IndianRupee className="w-8 h-8 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-parchment">
              Fee Receipts & Salary Vouchers
            </h1>
            <p className="text-mist text-xs sm:text-sm mt-1">
              Centralized accounts registry: filter, preview, and download official RMSPS receipts.
            </p>
          </div>
        </div>

        {/* ── Top Tabs (Student vs Teacher) ── */}
        <div className="flex p-1 bg-ink border border-hairline rounded-2xl">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-gold text-ink shadow-lg'
                : 'text-mist hover:text-parchment'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Receipts</span>
            <span
              className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'students' ? 'bg-ink text-gold' : 'bg-surface text-mist'
              }`}
            >
              {studentReceipts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-gold text-ink shadow-lg'
                : 'text-mist hover:text-parchment'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Teacher Vouchers</span>
            <span
              className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'teachers' ? 'bg-ink text-gold' : 'bg-surface text-mist'
              }`}
            >
              {teacherPayments.length}
            </span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB 1: STUDENT FEE RECEIPTS
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Controls: Class Filter & Search */}
          <div className="surface-card border-hairline rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {/* Class Dropdown - Default ALL */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-gold flex-shrink-0" />
                <label htmlFor="class-filter" className="text-xs font-semibold text-mist uppercase tracking-wider hidden sm:inline">
                  Class:
                </label>
                <select
                  id="class-filter"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="input-glass rounded-xl px-4 py-2 text-xs text-parchment bg-ink border border-hairline focus:outline-none focus:border-gold cursor-pointer w-full sm:w-56"
                >
                  <option value="all" className="bg-ink text-parchment">
                    All Classes (Default)
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink text-parchment">
                      {c.class_name} {c.section ? `(${c.section})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Name / Admission ID Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-mist absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or fee..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="input-glass rounded-xl pl-9 pr-4 py-2 text-xs text-parchment w-full bg-ink border border-hairline focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="text-xs font-mono text-mist w-full sm:w-auto text-right">
              Showing <span className="text-gold font-bold">{filteredStudentReceipts.length}</span> of {studentReceipts.length} Receipts
            </div>
          </div>

          {/* Student Receipts Table */}
          <div className="surface-card border-hairline rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-hairline text-mist font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Receipt / Particular</th>
                    <th className="py-4 px-6">Student Details</th>
                    <th className="py-4 px-6">Class</th>
                    <th className="py-4 px-6 text-right">Total (₹)</th>
                    <th className="py-4 px-6 text-right">Paid (₹)</th>
                    <th className="py-4 px-6 text-right">Balance (₹)</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredStudentReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-mist font-mono">
                        No receipts found matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentReceipts.map((item) => {
                      const receiptNo = `RMSPS/REC/${new Date().getFullYear()}/${item.id.substring(0, 6).toUpperCase()}`
                      const isPaid = item.status === 'paid' || item.paid_amount >= item.amount
                      const balance = Math.max(0, item.amount - item.paid_amount)
                      const isDownloading = downloadingId === `stu-${item.id}`

                      return (
                        <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-parchment font-mono text-sm">{receiptNo}</p>
                            <p className="text-[11px] text-mist mt-0.5">{item.fee_name}</p>
                            <p className="text-[10px] text-mist/60 font-mono mt-0.5">
                              {item.due_date ? new Date(item.due_date).toLocaleDateString('en-IN') : '—'}
                            </p>
                          </td>

                          <td className="py-4 px-6">
                            <p className="font-bold text-parchment text-sm">{item.student_name}</p>
                            <p className="text-[11px] text-gold font-mono mt-0.5">{item.student_id}</p>
                            {item.father_name && (
                              <p className="text-[10px] text-mist mt-0.5">S/D of: {item.father_name}</p>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-surface border border-hairline text-parchment font-mono text-[11px]">
                              {item.class_name} {item.section ? `(${item.section})` : ''}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right font-mono font-bold text-parchment">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>

                          <td className="py-4 px-6 text-right font-mono font-bold text-emerald-400">
                            ₹{item.paid_amount.toLocaleString('en-IN')}
                          </td>

                          <td className="py-4 px-6 text-right font-mono font-bold text-red-400">
                            ₹{balance.toLocaleString('en-IN')}
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isPaid
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : item.paid_amount > 0
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}
                            >
                              {isPaid ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Paid
                                </>
                              ) : item.paid_amount > 0 ? (
                                <>
                                  <Clock className="w-3 h-3" /> Partial
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3" /> Due
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedStudentReceipt(buildStudentReceiptData(item))}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-hairline text-xs font-semibold text-mist hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
                                title="Preview Receipt"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                              <button
                                onClick={() => handleDownloadStudentReceipt(item)}
                                disabled={isDownloading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/30 text-xs font-semibold text-gold hover:bg-gold/20 transition-colors cursor-pointer disabled:opacity-50"
                                title="Download PDF"
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                <span className="hidden sm:inline">PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 2: TEACHER PAYMENT VOUCHERS
         ═══════════════════════════════════════════════════════ */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          {/* Search bar: Case-Insensitive Teacher Search */}
          <div className="surface-card border-hairline rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-mist absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teacher by name or employee ID (case-insensitive)..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="input-glass rounded-xl pl-9 pr-4 py-2 text-xs text-parchment w-full bg-ink border border-hairline focus:outline-none focus:border-gold"
              />
            </div>

            <div className="text-xs font-mono text-mist w-full sm:w-auto text-right">
              Showing <span className="text-gold font-bold">{filteredTeacherPayments.length}</span> of {teacherPayments.length} Vouchers
            </div>
          </div>

          {/* Teacher Vouchers Table */}
          <div className="surface-card border-hairline rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-hairline text-mist font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Voucher No</th>
                    <th className="py-4 px-6">Teacher Details</th>
                    <th className="py-4 px-6">Payment Date</th>
                    <th className="py-4 px-6 text-right">Amount (₹)</th>
                    <th className="py-4 px-6">Remarks</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredTeacherPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-mist font-mono">
                        No teacher payment vouchers found.
                      </td>
                    </tr>
                  ) : (
                    filteredTeacherPayments.map((item) => {
                      const voucherNo = `RMSPS/PAY/${new Date().getFullYear()}/${item.id.substring(0, 6).toUpperCase()}`
                      const isDownloading = downloadingId === `tea-${item.id}`

                      return (
                        <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-parchment text-sm">
                            {voucherNo}
                          </td>

                          <td className="py-4 px-6">
                            <p className="font-bold text-parchment text-sm">{item.teacher_name}</p>
                            <p className="text-[11px] text-gold font-mono mt-0.5">{item.teacher_code}</p>
                            <p className="text-[10px] text-mist mt-0.5">{item.qualification}</p>
                          </td>

                          <td className="py-4 px-6 font-mono text-mist">
                            {item.payment_date
                              ? new Date(item.payment_date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>

                          <td className="py-4 px-6 text-right font-mono font-bold text-emerald-400 text-sm">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>

                          <td className="py-4 px-6 text-mist max-w-xs truncate">
                            {item.remarks || 'Monthly Salary Disbursement'}
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Credited
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedTeacherVoucher(buildTeacherVoucherData(item))}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-hairline text-xs font-semibold text-mist hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
                                title="Preview Salary Advice"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                              <button
                                onClick={() => handleDownloadTeacherVoucher(item)}
                                disabled={isDownloading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/30 text-xs font-semibold text-gold hover:bg-gold/20 transition-colors cursor-pointer disabled:opacity-50"
                                title="Download PDF Voucher"
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                <span className="hidden sm:inline">PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {selectedStudentReceipt && (
        <FeeReceiptModal
          data={selectedStudentReceipt}
          onClose={() => setSelectedStudentReceipt(null)}
        />
      )}

      {selectedTeacherVoucher && (
        <TeacherPaymentModal
          data={selectedTeacherVoucher}
          onClose={() => setSelectedTeacherVoucher(null)}
        />
      )}
    </div>
  )
}
