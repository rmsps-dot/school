import type { FeeReceiptData } from '@/components/pdf/FeeReceiptPdf'
import { FeeReceiptDocument } from '@/components/pdf/FeeReceiptPdf'
import type { TeacherPaymentData } from '@/components/pdf/TeacherPaymentPdf'
import { TeacherPaymentDocument } from '@/components/pdf/TeacherPaymentPdf'

export async function downloadFeeReceiptPDF(data: FeeReceiptData): Promise<{ success: boolean; error?: string }> {
  try {
    const { pdf } = await import('@react-pdf/renderer')

    let logoUrl: string | undefined
    if (typeof window !== 'undefined' && window.location?.origin) {
      logoUrl = `${window.location.origin}/icon-192.png`
    }

    const docElement = FeeReceiptDocument({
      data: { ...data, logoUrl: data.logoUrl || logoUrl },
    }) as Parameters<typeof pdf>[0]

    const blob = await pdf(docElement).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    const safeReceiptNo = (data.receiptNo || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeStudent = (data.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_')
    link.download = `RMSPS_Fee_Receipt_${safeStudent}_${safeReceiptNo}.pdf`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate Fee Receipt PDF'
    console.error('[downloadFeeReceiptPDF]', err)
    return { success: false, error: message }
  }
}

export async function downloadTeacherPaymentPDF(data: TeacherPaymentData): Promise<{ success: boolean; error?: string }> {
  try {
    const { pdf } = await import('@react-pdf/renderer')

    let logoUrl: string | undefined
    if (typeof window !== 'undefined' && window.location?.origin) {
      logoUrl = `${window.location.origin}/icon-192.png`
    }

    const docElement = TeacherPaymentDocument({
      data: { ...data, logoUrl: data.logoUrl || logoUrl },
    }) as Parameters<typeof pdf>[0]

    const blob = await pdf(docElement).toBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    const safeVoucher = (data.voucherNo || 'Voucher').replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeTeacher = (data.teacherName || 'Teacher').replace(/[^a-zA-Z0-9_-]/g, '_')
    link.download = `RMSPS_Salary_Advice_${safeTeacher}_${safeVoucher}.pdf`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate Teacher Payment PDF'
    console.error('[downloadTeacherPaymentPDF]', err)
    return { success: false, error: message }
  }
}
