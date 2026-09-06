import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

export interface FeeReceiptData {
  receiptNo: string
  date: string
  academicYear: string
  studentName: string
  studentId: string
  className: string
  parentName?: string
  feeName: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: string
  amountInWords: string
  paymentMode?: string
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
  receiptBanner: {
    backgroundColor: '#F3EFE6',
    borderLeft: '4px solid #D4AF6A',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0B0B10',
    letterSpacing: 1,
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
    width: 85,
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
  colDesc: { flex: 2.8 },
  colTotal: { flex: 1.3, textAlign: 'right' },
  colPaid: { flex: 1.3, textAlign: 'right' },
  colBalance: { flex: 1.3, textAlign: 'right' },
  colStatus: { flex: 1.3, textAlign: 'center' },

  summaryRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#F1F5F9',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    borderTop: '1.5px solid #CBD5E1',
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
  statusPaid: {
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
  },
  statusDue: {
    color: '#DC2626',
    fontFamily: 'Helvetica-Bold',
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

export function FeeReceiptDocument({ data }: { data: FeeReceiptData }) {
  const isPaid = data.status.toLowerCase() === 'paid' || data.balanceAmount <= 0

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

              {/* Receipt Banner */}
              <View style={styles.receiptBanner}>
                <Text style={styles.receiptTitle}>OFFICIAL FEE PAYMENT RECEIPT</Text>
                <Text style={styles.metaText}>
                  Receipt No: <Text style={styles.metaBold}>{data.receiptNo}</Text>
                </Text>
                <Text style={styles.metaText}>
                  Date: <Text style={styles.metaBold}>{data.date}</Text>
                </Text>
              </View>

              {/* Student Details Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Student Name:</Text>
                    <Text style={styles.infoVal}>{data.studentName || 'Student'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Admission ID:</Text>
                    <Text style={styles.infoVal}>{data.studentId || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Class / Section:</Text>
                    <Text style={styles.infoVal}>{data.className || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.infoColumn}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Father / Guardian:</Text>
                    <Text style={styles.infoVal}>{data.parentName || 'Parent / Guardian'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Academic Year:</Text>
                    <Text style={styles.infoVal}>{data.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Payment Mode:</Text>
                    <Text style={styles.infoVal}>{data.paymentMode || 'School Accounts / Portal'}</Text>
                  </View>
                </View>
              </View>

              {/* Fees Table */}
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.colDesc}>Particulars</Text>
                  <Text style={styles.colTotal}>Total (₹)</Text>
                  <Text style={styles.colPaid}>Paid (₹)</Text>
                  <Text style={styles.colBalance}>Balance (₹)</Text>
                  <Text style={styles.colStatus}>Status</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.colDesc}>{data.feeName || 'School Fee'}</Text>
                  <Text style={styles.colTotal}>{data.totalAmount.toFixed(2)}</Text>
                  <Text style={styles.colPaid}>{data.paidAmount.toFixed(2)}</Text>
                  <Text style={styles.colBalance}>{data.balanceAmount.toFixed(2)}</Text>
                  <Text style={[styles.colStatus, isPaid ? styles.statusPaid : styles.statusDue]}>
                    {isPaid ? 'PAID' : 'PARTIALLY PAID'}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text>Total Amount Deposited</Text>
                  <Text>₹ {data.paidAmount.toFixed(2)}</Text>
                </View>
              </View>

              {/* Amount In Words */}
              <View style={styles.wordsBox}>
                <Text style={styles.wordsText}>
                  Amount in words: <Text style={styles.wordsBold}>{data.amountInWords || 'Rupees Only'}</Text>
                </Text>
              </View>
            </View>

            {/* Footer & Signature */}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                <Text style={styles.footerDisclaimer}>
                  • This computer-generated receipt is officially valid and logged in the RMSPS central database.
                </Text>
                <Text style={styles.footerDisclaimer}>
                  • Fees once deposited are non-refundable and non-transferable under school policies.
                </Text>
                <Text style={styles.footerDisclaimer}>
                  • Please preserve this receipt for admission confirmation, examination clearance, and accounts audit.
                </Text>
              </View>
              <View style={styles.footerRight}>
                <View style={styles.sealBox}>
                  <Text style={styles.sealText}>RMSPS ACCOUNTS SEAL</Text>
                </View>
                <Text style={styles.signatureLine}>Accounts Officer / Principal</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
