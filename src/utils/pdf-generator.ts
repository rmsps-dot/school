import { renderToBuffer, Document } from '@react-pdf/renderer'
import { FeeReceiptDocument, FeeReceiptData } from '@/components/pdf/FeeReceiptPdf'
import { TeacherPaymentDocument, TeacherPaymentData } from '@/components/pdf/TeacherPaymentPdf'
import type { ComponentProps, ReactElement } from 'react'

export { numberToWords } from './number-to-words'

type DocumentElement = ReactElement<ComponentProps<typeof Document>>

function getSchoolLogoUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rmsps.vercel.app'
  return `${siteUrl}/icon-192.png`
}

/**
 * Generate Fee Receipt PDF Buffer for email attachments or direct downloads.
 */
export async function generateFeeReceiptPdfBuffer(data: FeeReceiptData): Promise<Buffer> {
  const logoUrl = data.logoUrl || getSchoolLogoUrl()
  const doc = FeeReceiptDocument({ data: { ...data, logoUrl } }) as DocumentElement
  return await renderToBuffer(doc)
}

/**
 * Generate Teacher Payment Voucher PDF Buffer for email attachments or downloads.
 */
export async function generateTeacherPaymentPdfBuffer(data: TeacherPaymentData): Promise<Buffer> {
  const logoUrl = data.logoUrl || getSchoolLogoUrl()
  const doc = TeacherPaymentDocument({ data: { ...data, logoUrl } }) as DocumentElement
  return await renderToBuffer(doc)
}
