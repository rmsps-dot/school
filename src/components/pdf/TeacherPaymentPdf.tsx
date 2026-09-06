import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

export interface TeacherPaymentData {
  voucherNo: string
  paymentDate: string
  teacherName: string
  teacherId: string
  qualification?: string
  amount: number
  amountInWords: string
  status: string
  remarks?: string
  recordedBy?: string
  logoUrl?: string
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#0B0B10',
    backgroundColor: '#FFFFFF',
  },
  borderWrapper: {
    border: '2px solid #3E5C76',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  innerBorder: {
    border: '1px solid #D4AF6A',
    borderRadius: 6,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottom: '1.5px solid #3E5C76',
    paddingBottom: 10,
    marginBottom: 10,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  headerTextContainer: {
    flex: 1,
    textAlign: 'center',
  },
  schoolName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#3E5C76',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  schoolSub: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#D4AF6A',
    marginBottom: 2,
  },
  schoolAddress: {
    fontSize: 7.5,
    color: '#475569',
    marginBottom: 1,
  },
  schoolMeta: {
    fontSize: 7,
    color: '#8A8F98',
  },
  banner: {
    backgroundColor: '#F3EFE6',
    borderLeft: '4px solid #3E5C76',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0B0B10',
    letterSpacing: 0.8,
  },
  metaText: {
    fontSize: 8.5,
    color: '#334155',
  },
  metaBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#0B0B10',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    border: '1px solid #E2E8F0',
  },
  infoColumn: {
    flex: 1,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 90,
    fontSize: 8,
    color: '#64748B',
    fontFamily: 'Helvetica-Bold',
  },
  infoVal: {
    flex: 1,
    fontSize: 8.5,
    color: '#0B0B10',
  },
  table: {
    marginBottom: 10,
    borderRadius: 4,
    border: '1px solid #CBD5E1',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#3E5C76',
    color: '#FFFFFF',
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    padding: 7,
    borderTop: '1px solid #E2E8F0',
    fontSize: 8.5,
  },
  colDesc: { flex: 3 },
  colHead: { flex: 1.5, textAlign: 'center' },
  colMode: { flex: 1.5, textAlign: 'center' },
  colAmount: { flex: 1.5, textAlign: 'right' },

  summaryRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#F0FDF4',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    borderTop: '1.5px solid #22C55E',
    color: '#15803D',
  },
  wordsBox: {
    backgroundColor: '#FAFAF9',
    border: '1px dashed #D4AF6A',
    borderRadius: 4,
    padding: 7,
    marginBottom: 10,
  },
  wordsText: {
    fontSize: 8,
    color: '#475569',
  },
  wordsBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#0B0B10',
  },
  remarksBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 4,
    padding: 6,
    marginBottom: 10,
  },
  remarksLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 8,
    color: '#1E293B',
  },
  footer: {
    marginTop: 8,
    borderTop: '1px solid #E2E8F0',
    paddingTop: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    flex: 2,
  },
  footerDisclaimer: {
    fontSize: 6.8,
    color: '#94A3B8',
    marginBottom: 2,
  },
  footerRight: {
    flex: 1,
    textAlign: 'center',
  },
  sealBox: {
    alignSelf: 'center',
    border: '1px dashed #3E5C76',
    borderRadius: 4,
    padding: 3,
    marginBottom: 4,
  },
  sealText: {
    fontSize: 6.5,
    color: '#3E5C76',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1px solid #0B0B10',
    marginTop: 14,
    paddingTop: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#3E5C76',
    textAlign: 'center',
  },
})

export function TeacherPaymentDocument({ data }: { data: TeacherPaymentData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.borderWrapper} wrap={false}>
          <View style={styles.innerBorder}>
            {/* Top Section */}
            <View>
              {/* Header */}
              <View style={styles.header}>
                {data.logoUrl ? (
                  <Image src={data.logoUrl} style={styles.logo} />
                ) : null}
                <View style={styles.headerTextContainer}>
                  <Text style={styles.schoolName}>
                    Residential Maa Saraswati Public School
                  </Text>
                  <Text style={styles.schoolSub}>
                    BSEB Affiliated • Recognised by Government of Bihar
                  </Text>
                  <Text style={styles.schoolAddress}>
                    Campus: Kating Chowk, Maheshpur road, Pipra, Supaul, Bihar - 852109
                  </Text>
                  <Text style={styles.schoolMeta}>
                    Helpline: +91 95465 36279 • Email: rmsps@admin.com • Reg: PSS217/19 • UDISE: 10060603629
                  </Text>
                </View>
              </View>

              {/* Banner */}
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>PAYMENT VOUCHER / SALARY ADVICE</Text>
                <Text style={styles.metaText}>
                  Voucher No: <Text style={styles.metaBold}>{data.voucherNo}</Text>
                </Text>
                <Text style={styles.metaText}>
                  Date: <Text style={styles.metaBold}>{data.paymentDate}</Text>
                </Text>
              </View>

              {/* Teacher Details Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Teacher Name:</Text>
                    <Text style={styles.infoVal}>{data.teacherName || 'Faculty Member'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Employee ID:</Text>
                    <Text style={styles.infoVal}>{data.teacherId || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.infoColumn}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Qualification / Role:</Text>
                    <Text style={styles.infoVal}>{data.qualification || 'Faculty Member'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Disbursement Mode:</Text>
                    <Text style={styles.infoVal}>Direct Credit / Bank Transfer</Text>
                  </View>
                </View>
              </View>

              {/* Earnings Table */}
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.colDesc}>Compensation Head / Description</Text>
                  <Text style={styles.colHead}>Type</Text>
                  <Text style={styles.colMode}>Status</Text>
                  <Text style={styles.colAmount}>Amount (₹)</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.colDesc}>Monthly Salary / Teaching Honorarium Disbursement</Text>
                  <Text style={styles.colHead}>Earning</Text>
                  <Text style={styles.colMode}>Disbursed</Text>
                  <Text style={styles.colAmount}>{data.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text>Net Amount Credited</Text>
                  <Text>₹ {data.amount.toFixed(2)}</Text>
                </View>
              </View>

              {/* Amount In Words */}
              <View style={styles.wordsBox}>
                <Text style={styles.wordsText}>
                  Amount in words: <Text style={styles.wordsBold}>{data.amountInWords || 'Rupees Only'}</Text>
                </Text>
              </View>

              {/* Remarks if present */}
              {data.remarks ? (
                <View style={styles.remarksBox}>
                  <Text style={styles.remarksLabel}>Accountant / Administrative Note:</Text>
                  <Text style={styles.remarksText}>{data.remarks}</Text>
                </View>
              ) : null}
            </View>

            {/* Footer & Signature */}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                <Text style={styles.footerDisclaimer}>
                  • This voucher is an official electronic payment advice processed by the RMSPS Finance & Accounts Desk.
                </Text>
                <Text style={styles.footerDisclaimer}>
                  • All statutory and internal accounting clearances have been verified for this disbursement.
                </Text>
                <Text style={styles.footerDisclaimer}>
                  • For queries regarding deductions or attendance credits, contact the school accounts department.
                </Text>
              </View>
              <View style={styles.footerRight}>
                <View style={styles.sealBox}>
                  <Text style={styles.sealText}>RMSPS ACCOUNTS SEAL</Text>
                </View>
                <Text style={styles.signatureLine}>Bursar / Accounts Officer</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
