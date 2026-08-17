import React from 'react'
import type { StudentMarksheet } from '@/actions/admin-result-actions'
import MarksheetPDFDocument from '@/components/shared/MarksheetPDFDocument'

export async function downloadMarksheetPDF(
  sheet: StudentMarksheet,
  approvedAt?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { pdf } = await import('@react-pdf/renderer')
    
    // Resolve logo URL if in browser environment
    let logoUrl: string | undefined
    if (typeof window !== 'undefined' && window.location?.origin) {
      logoUrl = `${window.location.origin}/icon-192.png`
    }

    const docElement = React.createElement(MarksheetPDFDocument, {
      sheet,
      approvedAt,
      logoUrl,
    })

    const blob = await pdf(docElement).toBlob()

    // Trigger direct client download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Clean filename e.g. Marksheet_STU-2024-001_Final_Exam.pdf
    const safeStudentCode = (sheet.studentCode || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeExam = (sheet.examType || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_')
    link.download = `Marksheet_${safeStudentCode}_${safeExam}.pdf`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate PDF'
    console.error('[downloadMarksheetPDF]', err)
    return { success: false, error: message }
  }
}
