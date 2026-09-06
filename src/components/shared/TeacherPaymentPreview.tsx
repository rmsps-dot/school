'use client'

import React from 'react'
import Image from 'next/image'
import type { TeacherPaymentData } from '@/components/pdf/TeacherPaymentPdf'

interface Props {
  data: TeacherPaymentData
}

export default function TeacherPaymentPreview({ data }: Props) {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 p-6 sm:p-8 font-sans">
      {/* Outer Border Frame */}
      <div className="border-2 border-[#3E5C76] rounded-xl p-4 sm:p-6 relative">
        <div className="border border-[#D4AF6A] rounded-lg p-4 sm:p-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 border-b-2 border-[#3E5C76] pb-4 mb-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF6A] flex-shrink-0 bg-slate-900">
              <Image
                src="/icon-192.png"
                alt="RMSPS Logo"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#3E5C76]">
                Residential Maa Saraswati Public School
              </h1>
              <p className="text-xs font-bold text-[#D4AF6A] tracking-wider uppercase mt-0.5">
                BSEB Affiliated • Recognised by Government of Bihar
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Campus: Kating Chowk, Maheshpur road, Pipra, Supaul, Bihar - 852109
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Helpline: +91 95465 36279 • Email: rmsps@admin.com • Reg: PSS217/19 • UDISE: 10060603629
              </p>
            </div>
          </div>

          {/* Voucher Title Banner */}
          <div className="bg-[#F3EFE6] border-l-4 border-[#3E5C76] rounded px-4 py-2.5 mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-widest text-slate-900">
              Salary Advice & Disbursement Voucher
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>Voucher No: <strong className="text-slate-900">{data.voucherNo}</strong></span>
              <span>Payment Date: <strong className="text-slate-900">{data.paymentDate}</strong></span>
            </div>
          </div>

          {/* Teacher Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-32">Teacher Name:</span>
                <span className="font-bold text-slate-900">{data.teacherName || 'Faculty Member'}</span>
              </div>
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-32">Employee ID:</span>
                <span className="font-mono font-bold text-slate-900">{data.teacherId || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-36">Qualification / Role:</span>
                <span className="font-semibold text-slate-800">{data.qualification || 'Faculty Member'}</span>
              </div>
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-36">Disbursement Mode:</span>
                <span className="font-semibold text-slate-800">Direct Credit / Bank Transfer</span>
              </div>
            </div>
          </div>

          {/* Particulars / Earnings Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#3E5C76] text-white font-bold">
                  <th className="p-2.5">Compensation Head / Description</th>
                  <th className="p-2.5 text-center">Type</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50 font-medium text-slate-800">
                  <td className="p-2.5">Monthly Teaching Salary / Honorarium Disbursement</td>
                  <td className="p-2.5 text-center text-slate-600">Earning</td>
                  <td className="p-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Disbursed
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-700 font-bold">
                    ₹{data.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-300 text-emerald-950">
                  <td colSpan={3} className="p-2.5 text-slate-800">Net Disbursed Amount</td>
                  <td className="p-2.5 text-right font-mono text-base text-emerald-800">
                    ₹{data.amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount In Words */}
          <div className="bg-stone-50 border border-dashed border-[#D4AF6A] rounded-lg p-3 mb-4 text-xs">
            <span className="text-slate-600">Amount in words: </span>
            <span className="font-bold text-slate-900 font-mono">{data.amountInWords || 'Rupees Only'}</span>
          </div>

          {/* Remarks / Notes */}
          {data.remarks && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs">
              <span className="font-semibold text-slate-600 block mb-0.5">Accountant / Administrative Note:</span>
              <span className="text-slate-800">{data.remarks}</span>
            </div>
          )}

          {/* Footer & Signatory */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-3 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 space-y-1">
              <p>• This voucher is an official electronic payment advice processed by the RMSPS Finance & Accounts Desk.</p>
              <p>• All statutory and internal accounting clearances have been verified for this disbursement.</p>
              <p>• For queries regarding deductions or attendance credits, contact the school accounts department.</p>
            </div>
            <div className="text-center sm:text-right flex-shrink-0">
              <div className="inline-block border border-dashed border-[#3E5C76] rounded px-3 py-1 mb-2">
                <span className="text-[9px] font-bold text-[#3E5C76] tracking-widest uppercase">RMSPS ACCOUNTS SEAL</span>
              </div>
              <div className="w-40 border-t border-slate-900 pt-1 text-center">
                <p className="text-[11px] font-bold text-[#3E5C76]">Bursar / Accounts Officer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
