'use client'

import React from 'react'
import Image from 'next/image'
import type { FeeReceiptData } from '@/components/pdf/FeeReceiptPdf'

interface Props {
  data: FeeReceiptData
}

export default function FeeReceiptPreview({ data }: Props) {
  const isPaid = data.status.toLowerCase() === 'paid' || data.balanceAmount <= 0

  return (
    <div
      className="bg-white text-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-200 p-6 sm:p-8 font-sans"
      style={{
        width: '100%',
        minWidth: '780px',
        maxWidth: '820px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Outer Border Box */}
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

          {/* Receipt Banner */}
          <div className="bg-[#F3EFE6] border-l-4 border-[#D4AF6A] rounded px-4 py-2.5 mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-widest text-slate-900">
              Official Fee Payment Receipt
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>Receipt No: <strong className="text-slate-900">{data.receiptNo}</strong></span>
              <span>Date: <strong className="text-slate-900">{data.date}</strong></span>
            </div>
          </div>

          {/* Student & Fee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-28">Student Name:</span>
                <span className="font-bold text-slate-900">{data.studentName || 'Student'}</span>
              </div>
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-28">Admission ID:</span>
                <span className="font-mono font-bold text-slate-900">{data.studentId || 'N/A'}</span>
              </div>
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-28">Class / Section:</span>
                <span className="font-semibold text-slate-800">{data.className || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-32">Father / Guardian:</span>
                <span className="font-semibold text-slate-800">{data.parentName || 'Parent / Guardian'}</span>
              </div>
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-32">Academic Year:</span>
                <span className="font-mono text-slate-800">{data.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}</span>
              </div>
              <div className="flex justify-between sm:justify-start gap-2">
                <span className="text-slate-500 font-medium w-32">Payment Mode:</span>
                <span className="font-semibold text-slate-800">{data.paymentMode || 'School Accounts / Portal'}</span>
              </div>
            </div>
          </div>

          {/* Particulars Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#3E5C76] text-white font-bold">
                  <th className="p-2.5">Particulars</th>
                  <th className="p-2.5 text-right">Total Due (₹)</th>
                  <th className="p-2.5 text-right">Paid Amount (₹)</th>
                  <th className="p-2.5 text-right">Remaining Balance (₹)</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50 font-medium text-slate-800">
                  <td className="p-2.5">{data.feeName || 'School Fee'}</td>
                  <td className="p-2.5 text-right font-mono">₹{data.totalAmount.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-emerald-700 font-bold">₹{data.paidAmount.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-red-600 font-bold">₹{data.balanceAmount.toFixed(2)}</td>
                  <td className="p-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isPaid ? 'Paid' : 'Partially Paid'}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colSpan={2} className="p-2.5 text-slate-700">Total Amount Received</td>
                  <td colSpan={3} className="p-2.5 text-right font-mono text-sm text-emerald-700">
                    ₹{data.paidAmount.toFixed(2)}
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

          {/* Footer & Authorized Signatory */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-3 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 space-y-1">
              <p>• This computer-generated receipt is officially valid and logged in the RMSPS central database.</p>
              <p>• Fees once deposited are non-refundable and non-transferable under school policies.</p>
              <p>• Please preserve this receipt for admission confirmation, examination clearance, and accounts audit.</p>
            </div>
            <div className="text-center sm:text-right flex-shrink-0">
              <div className="inline-block border border-dashed border-[#3E5C76] rounded px-3 py-1 mb-2">
                <span className="text-[9px] font-bold text-[#3E5C76] tracking-widest uppercase">RMSPS ACCOUNTS SEAL</span>
              </div>
              <div className="w-40 border-t border-slate-900 pt-1 text-center">
                <p className="text-[11px] font-bold text-[#3E5C76]">Accounts Officer / Principal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
