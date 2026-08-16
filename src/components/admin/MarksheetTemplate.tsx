/**
 * MarksheetTemplate.tsx
 *
 * A professional, printable Bihar Board / CBSE-style mark sheet.
 *
 * Rules:
 * - All styles are INLINE or use print-safe Tailwind utilities.
 * - NO glassmorphism, dark themes, or gradient colours here.
 * - High-contrast black-and-white design for clean PDF output.
 * - This component is rendered inside a hidden div, then window.print() is called.
 */

import type { StudentMarksheet } from '@/actions/admin-result-actions'
import { calcGrade } from '@/utils/helpers'

const EXAM_LABELS: Record<string, string> = {
  unit_test:  'Unit Test',
  mid_term:   'Mid-Term Examination',
  pre_board:  'Pre-Board Examination',
  final:      'Final Examination',
  other:      'Examination',
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    return iso
  }
}

interface Props {
  sheet: StudentMarksheet
  approvedAt?: string
  printId?: string
}

export default function MarksheetTemplate({ sheet, approvedAt, printId = 'marksheet-print' }: Props) {
  const examLabel  = EXAM_LABELS[sheet.examType] ?? sheet.examType
  const percentage = sheet.percentage.toFixed(2)
  const isPassed   = sheet.percentage >= 33

  // Determine pass/fail per subject
  const subjectsWithStatus = sheet.subjects.map((s) => ({
    ...s,
    passed: s.marksObtained >= s.passingMarks,
  }))

  return (
    <div
      id={printId}
      style={{
        fontFamily:      '"Times New Roman", Times, serif',
        color:           '#000',
        background:      '#fff',
        padding:         '16px 24px',
        width:           '100%',
        minWidth:        '210mm',
        maxWidth:        '210mm',
        margin:          '0 auto',
        fontSize:        '12px',
        lineHeight:      '1.4',
        boxSizing:       'border-box',
      }}
    >
      {/* ═══ TOP BORDER ═══ */}
      <div style={{ borderTop: '6px double #1a1a1a', marginBottom: '16px' }} />

      {/* ═══ SCHOOL HEADER ═══ */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        {/* School crest logo */}
        <div style={{
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          '72px',
          height:         '72px',
          borderRadius:   '50%',
          border:         '2px solid #1a1a1a',
          marginBottom:   '10px',
          overflow:       'hidden',
        }}>
          {/* Using a regular img tag since this is for window.print() */}
          <img src="/icon-192.png" alt="RMSPS Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Residential Maa Saraswati Public School
        </div>
        <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>
          (Recognised by Bihar School Examination Board, Patna)
        </div>
        <div style={{ fontSize: '11px', color: '#333', marginTop: '2px' }}>
          Supaul District, Bihar — PIN 852131 &nbsp;|&nbsp; Ph: 9546536279
        </div>
        <div style={{ fontSize: '11px', color: '#333' }}>
          Email: rmsps@admin.com &nbsp;|&nbsp; Website: rmsps.vercel.app
        </div>
      </div>

      {/* ═══ DOCUMENT TITLE ═══ */}
      <div style={{
        textAlign:     'center',
        fontSize:      '16px',
        fontWeight:    '900',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        border:        '2px solid #000',
        padding:       '6px 0',
        marginBottom:  '16px',
        background:    '#f5f5f5',
      }}>
        MARK SHEET — {examLabel.toUpperCase()}
      </div>

      {/* ═══ STUDENT DETAILS TABLE ═══ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #555', marginBottom: '16px' }}>
        <tbody>
          {[
            [
              ['Student Name', sheet.studentName],
              ['Roll No. / ID', sheet.studentCode]
            ],
            [
              ["Father's Name", sheet.fatherName ?? '—'],
              ["Mother's Name", sheet.motherName ?? '—']
            ],
            [
              ['Date of Birth', fmtDate(sheet.dob)],
              ['Class & Section', `${sheet.className} — Section ${sheet.section}`]
            ],
            [
              ['Academic Year', new Date().getFullYear() + '–' + (new Date().getFullYear() + 1)],
              ['Exam Name', examLabel]
            ]
          ].map(([leftItem, rightItem], rowIndex) => (
            <tr key={rowIndex}>
              <td style={{
                padding: '7px 12px',
                borderBottom: rowIndex < 3 ? '1px solid #bbb' : 'none',
                borderRight: '1px solid #bbb',
                width: '50%',
                background: rowIndex % 2 === 0 ? '#fafafa' : '#fff'
              }}>
                <span style={{ fontWeight: '700', fontSize: '11px', color: '#555', display: 'block' }}>{leftItem[0]}</span>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>{leftItem[1]}</span>
              </td>
              <td style={{
                padding: '7px 12px',
                borderBottom: rowIndex < 3 ? '1px solid #bbb' : 'none',
                width: '50%',
                background: '#fff'
              }}>
                <span style={{ fontWeight: '700', fontSize: '11px', color: '#555', display: 'block' }}>{rightItem[0]}</span>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>{rightItem[1]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ═══ MARKS TABLE ═══ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#1a1a1a', color: '#fff' }}>
            {['S.No.', 'Subject', 'Max. Marks', 'Pass Marks', 'Marks Obtained', 'Grade', 'Status'].map((h) => (
              <th key={h} style={{ padding: '9px 10px', textAlign: 'center', border: '1px solid #555', fontWeight: '700', letterSpacing: '0.3px' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjectsWithStatus.map((s, i) => {
            const rowPct  = s.totalMarks > 0 ? (s.marksObtained / s.totalMarks) * 100 : 0
            const rowGrade = calcGrade(rowPct)
            return (
              <tr
                key={s.id}
                style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}
              >
                <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #bbb' }}>{i + 1}</td>
                <td style={{ padding: '7px 12px', border: '1px solid #bbb', fontWeight: '600' }}>{s.subject}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #bbb' }}>{s.totalMarks}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #bbb' }}>{s.passingMarks}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #bbb', fontWeight: '700', fontSize: '14px' }}>{s.marksObtained}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #bbb', fontWeight: '700' }}>{rowGrade}</td>
                <td style={{
                  padding:    '7px 10px',
                  textAlign:  'center',
                  border:     '1px solid #bbb',
                  fontWeight: '800',
                  color:      s.passed ? '#166534' : '#991b1b',
                }}>
                  {s.passed ? 'PASS' : 'FAIL'}
                </td>
              </tr>
            )
          })}

          {/* Totals row */}
          <tr style={{ background: '#e8e8e8', fontWeight: '800' }}>
            <td colSpan={2} style={{ padding: '9px 12px', border: '1px solid #555', textAlign: 'right', letterSpacing: '0.3px' }}>
              TOTAL
            </td>
            <td style={{ padding: '9px 10px', textAlign: 'center', border: '1px solid #555' }}>{sheet.grandTotal}</td>
            <td style={{ padding: '9px 10px', textAlign: 'center', border: '1px solid #555' }}>—</td>
            <td style={{ padding: '9px 10px', textAlign: 'center', border: '1px solid #555', fontSize: '15px' }}>{sheet.totalObtained}</td>
            <td style={{ padding: '9px 10px', textAlign: 'center', border: '1px solid #555' }}>{sheet.grade}</td>
            <td style={{
              padding:    '9px 10px',
              textAlign:  'center',
              border:     '1px solid #555',
              color:      isPassed ? '#166534' : '#991b1b',
              fontSize:   '14px',
            }}>
              {isPassed ? '✓ PASS' : '✗ FAIL'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══ RESULT SUMMARY BOX ═══ */}
      <div style={{
        display:       'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:           '0',
        border:        '2px solid #1a1a1a',
        marginBottom:  '16px',
        textAlign:     'center',
      }}>
        {[
          ['Total Marks Obtained', `${sheet.totalObtained} / ${sheet.grandTotal}`],
          ['Percentage',           `${percentage}%`],
          ['Overall Grade',        sheet.grade],
        ].map(([label, value], i) => (
          <div
            key={label}
            style={{
              padding:     '10px 8px',
              borderRight: i < 2 ? '2px solid #1a1a1a' : 'none',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {label}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', marginTop: '4px' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ RESULT DECLARATION ═══ */}
      <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>
        Result: &nbsp;
        <span style={{
          fontSize:   '16px',
          fontWeight: '900',
          color:      isPassed ? '#166534' : '#991b1b',
          border:     `2px solid ${isPassed ? '#166534' : '#991b1b'}`,
          padding:    '2px 18px',
          letterSpacing: '2px',
        }}>
          {isPassed ? 'PASSED' : 'FAILED'}
        </span>
      </div>

      {/* ═══ GRADE SCALE ═══ */}
      <div style={{ fontSize: '10px', color: '#555', textAlign: 'center', marginBottom: '16px', fontStyle: 'italic' }}>
        Grade Scale: A1 (91–100%) | A2 (81–90%) | B1 (71–80%) | B2 (61–70%) | C1 (51–60%) | C2 (41–50%) | D (33–40%) | F (Below 33%)
      </div>

      {/* ═══ APPROVAL INFO ═══ */}
      {approvedAt && (
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#555', marginBottom: '16px', fontStyle: 'italic' }}>
          This mark sheet was approved on {fmtDate(approvedAt)} by the School Administration.
        </div>
      )}

      {/* ═══ SIGNATURE SECTION ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '4px', marginTop: '24px' }}>
        {['Class Teacher', 'Examination Coordinator', 'Principal'].map((title) => (
          <div key={title} style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1.5px solid #333', paddingTop: '4px', marginTop: '30px' }}>
              <div style={{ fontWeight: '700', fontSize: '12px' }}>{title}</div>
              <div style={{ fontSize: '10px', color: '#555' }}>Residential Maa Saraswati Public School</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ BOTTOM BORDER + DISCLAIMER ═══ */}
      <div style={{ borderTop: '1px solid #bbb', marginTop: '16px', paddingTop: '8px' }}>
        <p style={{ fontSize: '9.5px', color: '#666', textAlign: 'center', fontStyle: 'italic', margin: 0 }}>
          This is a computer-generated mark sheet. Any alteration makes it invalid.
          Results are subject to verification by the school authority.
          Issued by Residential Maa Saraswati Public School, Supaul, Bihar.
        </p>
      </div>

      <div style={{ borderTop: '6px double #1a1a1a', marginTop: '12px' }} />
    </div>
  )
}

/* ── Local grade helper (same as server) ── */

