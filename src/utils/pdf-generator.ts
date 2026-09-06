import { renderToBuffer, Document } from '@react-pdf/renderer'
import { FeeReceiptDocument, FeeReceiptData } from '@/components/pdf/FeeReceiptPdf'
import { TeacherPaymentDocument, TeacherPaymentData } from '@/components/pdf/TeacherPaymentPdf'
import type { ComponentProps, ReactElement } from 'react'

type DocumentElement = ReactElement<ComponentProps<typeof Document>>

/**
 * Convert numeric Indian currency into words (e.g. 2500 -> "Two Thousand Five Hundred Rupees Only")
 */
export function numberToWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only'
  if (amount < 0) return 'Negative ' + numberToWords(Math.abs(amount))

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertChunk(num: number): string {
    let str = ''
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + ' Hundred '
      num %= 100
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + ' '
      num %= 10
    }
    if (num > 0) {
      str += units[num] + ' '
    }
    return str.trim()
  }

  const integerPart = Math.floor(amount)
  const decimalPart = Math.round((amount - integerPart) * 100)

  let result = ''

  const crore = Math.floor(integerPart / 10000000)
  const lakh = Math.floor((integerPart % 10000000) / 100000)
  const thousand = Math.floor((integerPart % 100000) / 1000)
  const remainder = integerPart % 1000

  if (crore > 0) result += convertChunk(crore) + ' Crore '
  if (lakh > 0) result += convertChunk(lakh) + ' Lakh '
  if (thousand > 0) result += convertChunk(thousand) + ' Thousand '
  if (remainder > 0) result += convertChunk(remainder) + ' '

  result = result.trim() + ' Rupees'

  if (decimalPart > 0) {
    result += ' and ' + convertChunk(decimalPart) + ' Paise'
  }

  return result.trim() + ' Only'
}

/**
 * Generate Fee Receipt PDF Buffer for email attachments or direct downloads.
 */
export async function generateFeeReceiptPdfBuffer(data: FeeReceiptData): Promise<Buffer> {
  const doc = FeeReceiptDocument({ data }) as DocumentElement
  return await renderToBuffer(doc)
}

/**
 * Generate Teacher Payment Voucher PDF Buffer for email attachments or downloads.
 */
export async function generateTeacherPaymentPdfBuffer(data: TeacherPaymentData): Promise<Buffer> {
  const doc = TeacherPaymentDocument({ data }) as DocumentElement
  return await renderToBuffer(doc)
}
