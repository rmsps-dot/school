import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0B0B10',
    backgroundColor: '#FFFFFF',
  },
  borderWrapper: {
    border: '2px solid #3E5C76',
    borderRadius: 8,
    padding: 20,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    textAlign: 'center',
    borderBottom: '1.5px solid #E2E8F0',
    paddingBottom: 14,
    marginBottom: 14,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#3E5C76',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  schoolSub: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 3,
  },
  schoolAddress: {
    fontSize: 8.5,
    color: '#8A8F98',
  },
  receiptBanner: {
    backgroundColor: '#F3EFE6',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0B0B10',
    letterSpacing: 1,
  },
  metaText: {
    fontSize: 9,
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
    padding: 10,
    marginBottom: 14,
    border: '1px solid #E2E8F0',
  },
  infoColumn: {
    flex: 1,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 90,
    fontSize: 8.5,
    color: '#64748B',
    fontFamily: 'Helvetica-Bold',
  },
  infoVal: {
    flex: 1,
    fontSize: 9,
    color: '#0B0B10',
  },
  table: {
    marginBottom: 14,
    borderRadius: 4,
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#3E5C76',
    color: '#FFFFFF',
    padding: 7,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
    borderTop: '1px solid #E2E8F0',
    fontSize: 9,
  },
  colDesc: { flex: 3 },
  colTotal: { flex: 1.2, textAlign: 'right' },
  colPaid: { flex: 1.2, textAlign: 'right' },
  colBalance: { flex: 1.2, textAlign: 'right' },
  colStatus: { flex: 1.2, textAlign: 'center' },

  summaryRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    borderTop: '1.5px solid #CBD5E1',
  },
  wordsBox: {
    backgroundColor: '#FAFAF9',
    border: '1px dashed #D4AF6A',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  wordsText: {
    fontSize: 8.5,
    color: '#475569',
    fontStyle: 'italic',
  },
  statusBadgePaid: {
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid #E2E8F0',
    paddingTop: 12,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    flex: 2,
  },
  footerDisclaimer: {
    fontSize: 7.5,
    color: '#94A3B8',
    marginBottom: 3,
  },
  footerRight: {
    flex: 1,
    textAlign: 'center',
    paddingTop: 24,
  },
  signatureLine: {
    borderTop: '1px solid #0B0B10',
    marginTop: 20,
    paddingTop: 4,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#3E5C76',
  },
})

export function FeeReceiptDocument({ data }: { data: FeeReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.borderWrapper}>
          {/* Top Section */}
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.schoolName}>
                Residential Maa Saraswati Public School
              </Text>
              <Text style={styles.schoolSub}>
                Affiliated & Recognised • English Medium Residential School
              </Text>
              <Text style={styles.schoolAddress}>
                Campus: Near Railway Crossing, Main Road • Contact: +91 94700 00000 • Web: rmsps.edu
              </Text>
            </View>

            {/* Receipt Banner */}
            <View style={styles.receiptBanner}>
              <Text style={styles.receiptTitle}>OFFICIAL FEE RECEIPT</Text>
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
                  <Text style={styles.infoVal}>{data.studentName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Admission ID:</Text>
                  <Text style={styles.infoVal}>{data.studentId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Class / Section:</Text>
                  <Text style={styles.infoVal}>{data.className}</Text>
                </View>
              </View>

              <View style={styles.infoColumn}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Father / Guardian:</Text>
                  <Text style={styles.infoVal}>{data.parentName || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Academic Year:</Text>
                  <Text style={styles.infoVal}>{data.academicYear}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment Mode:</Text>
                  <Text style={styles.infoVal}>{data.paymentMode || 'Online / Portal'}</Text>
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
                <Text style={styles.colDesc}>{data.feeName}</Text>
                <Text style={styles.colTotal}>{data.totalAmount.toFixed(2)}</Text>
                <Text style={styles.colPaid}>{data.paidAmount.toFixed(2)}</Text>
                <Text style={styles.colBalance}>{data.balanceAmount.toFixed(2)}</Text>
                <Text style={[styles.colStatus, styles.statusBadgePaid]}>
                  {data.status.toUpperCase()}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text>Total Amount Received</Text>
                <Text>₹ {data.paidAmount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Amount In Words */}
            <View style={styles.wordsBox}>
              <Text style={styles.wordsText}>
                Amount in words: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.amountInWords}</Text>
              </Text>
            </View>
          </View>

          {/* Footer & Signature */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerDisclaimer}>
                • This receipt is system generated and does not require a physical signature.
              </Text>
              <Text style={styles.footerDisclaimer}>
                • Fees once deposited are non-refundable and non-transferable under school policies.
              </Text>
              <Text style={styles.footerDisclaimer}>
                • Please preserve this receipt for future reference and clearance at examination time.
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.signatureLine}>Accounts Officer / RMSPS</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
