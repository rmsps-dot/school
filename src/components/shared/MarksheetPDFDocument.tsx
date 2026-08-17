import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { StudentMarksheet } from '@/actions/admin-result-actions'
import { calcGrade } from '@/utils/helpers'

const EXAM_LABELS: Record<string, string> = {
  unit_test: 'Unit Test',
  mid_term: 'Mid-Term Examination',
  pre_board: 'Pre-Board Examination',
  final: 'Final Examination',
  other: 'Examination',
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso || iso === 'N/A' || iso === '—' || iso === 'Invalid Date') return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: 'Times-Roman',
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  doubleBorderTop: {
    borderTopWidth: 2,
    borderTopColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingTop: 1,
    marginBottom: 8,
  },
  doubleBorderBottom: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
    paddingTop: 1,
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 6,
  },
  schoolName: {
    fontFamily: 'Times-Bold',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  affiliation: {
    fontFamily: 'Times-Bold',
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  contactInfo: {
    fontSize: 8,
    color: '#333333',
    marginTop: 2,
    textAlign: 'center',
  },
  docTitleContainer: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  docTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  studentInfoTable: {
    borderWidth: 1,
    borderColor: '#555555',
    marginBottom: 10,
  },
  studentInfoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bbbbbb',
  },
  studentInfoRowLast: {
    flexDirection: 'row',
  },
  studentInfoColLeft: {
    width: '50%',
    padding: 4,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#bbbbbb',
    backgroundColor: '#fafafa',
  },
  studentInfoColRight: {
    width: '50%',
    padding: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
  },
  infoLabel: {
    fontFamily: 'Times-Bold',
    fontSize: 7.5,
    color: '#555555',
    marginBottom: 1,
  },
  infoValue: {
    fontFamily: 'Times-Bold',
    fontSize: 9,
    color: '#000000',
  },
  table: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555555',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontFamily: 'Times-Bold',
    fontSize: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#555555',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bbbbbb',
    fontSize: 8.5,
    paddingVertical: 4,
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#fafafa',
  },
  tableRowTotal: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    fontFamily: 'Times-Bold',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#555555',
  },
  colSNo: {
    width: '8%',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#bbbbbb',
  },
  colSubject: {
    width: '32%',
    paddingLeft: 6,
    borderRightWidth: 1,
    borderRightColor: '#bbbbbb',
  },
  colMaxMarks: {
    width: '15%',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#bbbbbb',
  },
  colPassMarks: {
    width: '15%',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#bbbbbb',
  },
  colMarksObtained: {
    width: '15%',
    textAlign: 'center',
    fontFamily: 'Times-Bold',
    borderRightWidth: 1,
    borderRightColor: '#bbbbbb',
  },
  colGrade: {
    width: '8%',
    textAlign: 'center',
    fontFamily: 'Times-Bold',
    borderRightWidth: 1,
    borderRightColor: '#bbbbbb',
  },
  colStatus: {
    width: '7%',
    textAlign: 'center',
    fontFamily: 'Times-Bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
    marginBottom: 8,
  },
  summaryCol: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRightWidth: 1.5,
    borderRightColor: '#1a1a1a',
  },
  summaryColLast: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: 'Times-Bold',
    fontSize: 7.5,
    color: '#555555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontFamily: 'Times-Bold',
    fontSize: 13,
    marginTop: 2,
  },
  resultBadgeContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  resultBadge: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    letterSpacing: 1.5,
  },
  passBadge: {
    borderColor: '#166534',
    color: '#166534',
  },
  failBadge: {
    borderColor: '#991b1b',
    color: '#991b1b',
  },
  legend: {
    fontSize: 7,
    color: '#555555',
    textAlign: 'center',
    fontFamily: 'Times-Italic',
    marginVertical: 4,
  },
  approvalText: {
    fontSize: 7.5,
    color: '#555555',
    textAlign: 'center',
    fontFamily: 'Times-Italic',
    marginBottom: 4,
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
  },
  signatureBox: {
    width: '30%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 3,
    alignItems: 'center',
  },
  signatureTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 8.5,
    textAlign: 'center',
  },
  signatureSchool: {
    fontSize: 7,
    color: '#555555',
    marginTop: 1,
    textAlign: 'center',
  },
  disclaimer: {
    borderTopWidth: 0.5,
    borderTopColor: '#bbbbbb',
    paddingTop: 4,
    marginTop: 6,
  },
  disclaimerText: {
    fontSize: 6.5,
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'Times-Italic',
  },
})

interface MarksheetPDFDocumentProps {
  sheet: StudentMarksheet
  approvedAt?: string
  logoUrl?: string
}

export default function MarksheetPDFDocument({ sheet, approvedAt, logoUrl }: MarksheetPDFDocumentProps) {
  const examLabel = EXAM_LABELS[sheet.examType] ?? sheet.examType
  const percentage = sheet.percentage.toFixed(2)
  const isPassed = sheet.percentage >= 33
  const currentYear = new Date().getFullYear()
  const academicYear = `${currentYear}–${currentYear + 1}`

  const subjectsWithStatus = sheet.subjects.map((s) => ({
    ...s,
    passed: s.marksObtained >= s.passingMarks,
  }))

  return (
    <Document title={`Marksheet - ${sheet.studentName} (${sheet.studentCode})`}>
      <Page size="A4" style={styles.page}>
        {/* Top Double Border */}
        <View style={styles.doubleBorderTop} />

        {/* Header */}
        <View style={styles.header}>
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
          <Text style={styles.schoolName}>Residential Maa Saraswati Public School</Text>
          <Text style={styles.affiliation}>(Recognised by Bihar School Examination Board, Patna)</Text>
          <Text style={styles.contactInfo}>
            Supaul District, Bihar — PIN 852131 | Ph: 9546536279
          </Text>
          <Text style={styles.contactInfo}>
            Email: rmsps@admin.com | Website: rmsps.vercel.app
          </Text>
        </View>

        {/* Document Title */}
        <View style={styles.docTitleContainer}>
          <Text style={styles.docTitle}>MARK SHEET — {examLabel.toUpperCase()}</Text>
        </View>

        {/* Student Information Table */}
        <View style={styles.studentInfoTable}>
          {/* Row 1 */}
          <View style={styles.studentInfoRow}>
            <View style={styles.studentInfoColLeft}>
              <Text style={styles.infoLabel}>Student Name</Text>
              <Text style={styles.infoValue}>{sheet.studentName}</Text>
            </View>
            <View style={styles.studentInfoColRight}>
              <Text style={styles.infoLabel}>Roll No. / ID</Text>
              <Text style={styles.infoValue}>{sheet.studentCode}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.studentInfoRow}>
            <View style={styles.studentInfoColLeft}>
              <Text style={styles.infoLabel}>Father&apos;s Name</Text>
              <Text style={styles.infoValue}>{sheet.fatherName ?? '—'}</Text>
            </View>
            <View style={styles.studentInfoColRight}>
              <Text style={styles.infoLabel}>Mother&apos;s Name</Text>
              <Text style={styles.infoValue}>{sheet.motherName ?? '—'}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.studentInfoRow}>
            <View style={styles.studentInfoColLeft}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{fmtDate(sheet.dob)}</Text>
            </View>
            <View style={styles.studentInfoColRight}>
              <Text style={styles.infoLabel}>Class &amp; Section</Text>
              <Text style={styles.infoValue}>{sheet.className} — Section {sheet.section}</Text>
            </View>
          </View>

          {/* Row 4 */}
          <View style={styles.studentInfoRowLast}>
            <View style={styles.studentInfoColLeft}>
              <Text style={styles.infoLabel}>Academic Year</Text>
              <Text style={styles.infoValue}>{academicYear}</Text>
            </View>
            <View style={styles.studentInfoColRight}>
              <Text style={styles.infoLabel}>Exam Name</Text>
              <Text style={styles.infoValue}>{examLabel}</Text>
            </View>
          </View>
        </View>

        {/* Marks Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colSNo, { color: '#ffffff' }]}>S.No.</Text>
            <Text style={[styles.colSubject, { color: '#ffffff' }]}>Subject</Text>
            <Text style={[styles.colMaxMarks, { color: '#ffffff' }]}>Max. Marks</Text>
            <Text style={[styles.colPassMarks, { color: '#ffffff' }]}>Pass Marks</Text>
            <Text style={[styles.colMarksObtained, { color: '#ffffff' }]}>Marks Obtained</Text>
            <Text style={[styles.colGrade, { color: '#ffffff' }]}>Grade</Text>
            <Text style={[styles.colStatus, { color: '#ffffff' }]}>Status</Text>
          </View>

          {/* Subject Rows */}
          {subjectsWithStatus.map((s, i) => {
            const rowPct = s.totalMarks > 0 ? (s.marksObtained / s.totalMarks) * 100 : 0
            const rowGrade = calcGrade(rowPct)
            const isRowEven = i % 2 === 0
            return (
              <View key={s.id ?? i} style={[styles.tableRow, isRowEven ? styles.tableRowEven : styles.tableRowOdd]}>
                <Text style={styles.colSNo}>{i + 1}</Text>
                <Text style={[styles.colSubject, { fontFamily: 'Times-Bold' }]}>{s.subject}</Text>
                <Text style={styles.colMaxMarks}>{s.totalMarks}</Text>
                <Text style={styles.colPassMarks}>{s.passingMarks}</Text>
                <Text style={styles.colMarksObtained}>{s.marksObtained}</Text>
                <Text style={styles.colGrade}>{rowGrade}</Text>
                <Text style={[styles.colStatus, { color: s.passed ? '#166534' : '#991b1b' }]}>
                  {s.passed ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            )
          })}

          {/* Totals Row */}
          <View style={styles.tableRowTotal}>
            <Text style={[styles.colSNo, { width: '40%', textAlign: 'right', paddingRight: 8 }]}>TOTAL</Text>
            <Text style={styles.colMaxMarks}>{sheet.grandTotal}</Text>
            <Text style={styles.colPassMarks}>—</Text>
            <Text style={styles.colMarksObtained}>{sheet.totalObtained}</Text>
            <Text style={styles.colGrade}>{sheet.grade}</Text>
            <Text style={[styles.colStatus, { color: isPassed ? '#166534' : '#991b1b' }]}>
              {isPassed ? 'PASS' : 'FAIL'}
            </Text>
          </View>
        </View>

        {/* Result Summary Box */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total Marks Obtained</Text>
            <Text style={styles.summaryValue}>{sheet.totalObtained} / {sheet.grandTotal}</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Percentage</Text>
            <Text style={styles.summaryValue}>{percentage}%</Text>
          </View>
          <View style={styles.summaryColLast}>
            <Text style={styles.summaryLabel}>Overall Grade</Text>
            <Text style={styles.summaryValue}>{sheet.grade}</Text>
          </View>
        </View>

        {/* Result Declaration */}
        <View style={styles.resultBadgeContainer}>
          <Text style={[styles.resultBadge, isPassed ? styles.passBadge : styles.failBadge]}>
            RESULT: {isPassed ? 'PASSED' : 'FAILED'}
          </Text>
        </View>

        {/* Grade Scale */}
        <Text style={styles.legend}>
          Grade Scale: A1 (91–100%) | A2 (81–90%) | B1 (71–80%) | B2 (61–70%) | C1 (51–60%) | C2 (41–50%) | D (33–40%) | F (Below 33%)
        </Text>

        {/* Approval Info */}
        {approvedAt ? (
          <Text style={styles.approvalText}>
            This mark sheet was approved on {fmtDate(approvedAt)} by the School Administration.
          </Text>
        ) : null}

        {/* Signatures */}
        <View style={styles.signatureContainer}>
          {['Class Teacher', 'Examination Coordinator', 'Principal'].map((title) => (
            <View key={title} style={styles.signatureBox}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureTitle}>{title}</Text>
                <Text style={styles.signatureSchool}>Residential Maa Saraswati Public School</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This is a computer-generated mark sheet. Any alteration makes it invalid. Results are subject to verification by the school authority.
          </Text>
          <Text style={styles.disclaimerText}>
            Issued by Residential Maa Saraswati Public School, Supaul, Bihar.
          </Text>
        </View>

        {/* Bottom Double Border */}
        <View style={styles.doubleBorderBottom} />
      </Page>
    </Document>
  )
}
