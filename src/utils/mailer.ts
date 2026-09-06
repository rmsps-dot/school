import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
})

function getSchoolHeaderHtml(title: string, subtitle?: string): string {
  return `
    <div style="background-color: #0B0B10; padding: 28px 24px; text-align: center; border-bottom: 3px solid #3E5C76;">
      <h1 style="color: #F3EFE6; margin: 0 0 6px 0; font-size: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">
        Residential Maa Saraswati Public School
      </h1>
      <p style="color: #D4AF6A; margin: 0 0 4px 0; font-size: 13px; font-weight: bold;">
        ${title}
      </p>
      ${subtitle ? `<p style="color: #8A8F98; margin: 0; font-size: 11px;">${subtitle}</p>` : ''}
    </div>
  `
}

function getSchoolFooterHtml(): string {
  return `
    <div style="background-color: #F1F5F9; padding: 20px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
      <p style="font-size: 12px; color: #64748B; margin: 0 0 4px 0; font-weight: bold;">
        Residential Maa Saraswati Public School (RMSPS)
      </p>
      <p style="font-size: 11px; color: #94A3B8; margin: 0 0 8px 0;">
        Near Railway Crossing, Main Campus • Phone: +91 94700 00000 • Email: admin@rmsps.edu
      </p>
      <p style="font-size: 10px; color: #CBD5E1; margin: 0;">
        &copy; ${new Date().getFullYear()} Residential Maa Saraswati Public School. All rights reserved.
      </p>
    </div>
  `
}

/* ══════════════════════════════════════════════════════════════
   1. PARENT CREDENTIALS (EXISTING)
   ══════════════════════════════════════════════════════════════ */
export async function sendParentCredentials(
  toEmail: string,
  parentName: string,
  studentName: string,
  passwordText: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping email send.')
    return { success: false, error: 'SMTP not configured' }
  }

  const mailOptions = {
    from: `"RMSPS Admissions" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Your Parent Account Credentials for RMSPS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        ${getSchoolHeaderHtml('Welcome to the RMSPS Parent Community', 'Account Access Information')}
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #334155;">Dear <strong>${parentName}</strong>,</p>
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">
            We are pleased to inform you that your child <strong>${studentName}</strong>'s admission request has been approved.
          </p>
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">
            A Parent Portal account has been automatically created for you. You can use this account to track attendance, fees, homework, and report cards.
          </p>
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748B; font-weight: bold; text-transform: uppercase;">Your Portal Credentials:</p>
            <p style="margin: 0 0 8px 0; font-size: 15px; color: #0F172A;"><strong>Email:</strong> ${toEmail}</p>
            <p style="margin: 0; font-size: 15px; color: #0F172A;"><strong>Password:</strong> <span style="font-family: monospace; background: #E2E8F0; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${passwordText}</span></p>
          </div>
          <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
            <em>Please log in and change your password as soon as possible for security reasons.</em>
          </p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rmsps.edu'}/login?role=parent" style="display: inline-block; background-color: #3E5C76; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; margin-top: 16px; font-size: 14px;">
            Go to Parent Portal
          </a>
        </div>
        ${getSchoolFooterHtml()}
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending parent credentials email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

/* ══════════════════════════════════════════════════════════════
   2. STUDENT ATTENDANCE ALERT (ABSENT / LATE)
   ══════════════════════════════════════════════════════════════ */
export interface AttendanceAlertParams {
  toEmail: string
  parentName: string
  studentName: string
  className: string
  date: string
  status: 'absent' | 'late'
  time?: string
}

export async function sendAttendanceAlertEmail({
  toEmail,
  parentName,
  studentName,
  className,
  date,
  status,
  time,
}: AttendanceAlertParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping attendance alert email.')
    return { success: false, error: 'SMTP not configured' }
  }

  const isAbsent = status === 'absent'
  const statusColor = isAbsent ? '#DC2626' : '#D97706'
  const statusBg = isAbsent ? '#FEF2F2' : '#FFFBEB'
  const statusBorder = isAbsent ? '#F87171' : '#FCD34D'
  const statusLabel = isAbsent ? 'ABSENT' : 'LATE'

  const mailOptions = {
    from: `"RMSPS Attendance Desk" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Attendance Alert: ${studentName} marked ${statusLabel} on ${date} - RMSPS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        ${getSchoolHeaderHtml('Daily Student Attendance Notification')}
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">Dear <strong>${parentName || 'Parent / Guardian'}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            This is an automated attendance alert from the school administration to inform you regarding your child's attendance record today.
          </p>

          <div style="background-color: ${statusBg}; border: 1.5px solid ${statusBorder}; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: inline-block; background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; letter-spacing: 1px; margin-bottom: 12px;">
              STATUS: ${statusLabel}
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #0F172A;">
              <tr>
                <td style="padding: 4px 0; color: #64748B; width: 130px;"><strong>Student Name:</strong></td>
                <td style="padding: 4px 0; font-weight: bold;">${studentName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Class / Section:</strong></td>
                <td style="padding: 4px 0;">${className}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Date:</strong></td>
                <td style="padding: 4px 0;">${date}</td>
              </tr>
              ${time ? `
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Reported At:</strong></td>
                <td style="padding: 4px 0;">${time}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
            If this absence was unplanned or in case of an emergency, please notify the class teacher or apply for official leave via the Parent Portal. If you believe this notification is in error, kindly contact the school office immediately.
          </p>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rmsps.edu'}/parent/attendance" style="display: inline-block; background-color: #3E5C76; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: bold; margin-top: 14px; font-size: 13px;">
            View Attendance Records
          </a>
        </div>
        ${getSchoolFooterHtml()}
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending attendance alert email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

/* ══════════════════════════════════════════════════════════════
   3. MONTH-END FEE REMINDER EMAIL
   ══════════════════════════════════════════════════════════════ */
export interface FeeReminderParams {
  toEmail: string
  parentName: string
  studentName: string
  className: string
  feeName: string
  amount: number
  paidAmount: number
  dueDate: string
}

export async function sendFeeReminderEmail({
  toEmail,
  parentName,
  studentName,
  className,
  feeName,
  amount,
  paidAmount,
  dueDate,
}: FeeReminderParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping fee reminder email.')
    return { success: false, error: 'SMTP not configured' }
  }

  const pendingAmount = Math.max(0, amount - paidAmount)

  const mailOptions = {
    from: `"RMSPS Accounts Desk" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Fee Reminder: ${feeName} for ${studentName} - RMSPS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        ${getSchoolHeaderHtml('Monthly School Fee Reminder')}
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">Dear <strong>${parentName || 'Parent / Guardian'}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            This is a friendly reminder that the school fee for your ward <strong>${studentName}</strong> (${className}) is due for payment.
          </p>

          <div style="background-color: #FFFDF8; border: 1.5px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #B45309; font-weight: bold; text-transform: uppercase;">
              Fee Summary & Outstanding Dues
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #0F172A;">
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Fee Particular:</strong></td>
                <td style="padding: 4px 0; font-weight: bold;">${feeName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Total Fee:</strong></td>
                <td style="padding: 4px 0;">₹ ${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Amount Paid:</strong></td>
                <td style="padding: 4px 0;">₹ ${paidAmount.toFixed(2)}</td>
              </tr>
              <tr style="border-top: 1px solid #E2E8F0;">
                <td style="padding: 8px 0; color: #DC2626; font-size: 15px;"><strong>Pending Due:</strong></td>
                <td style="padding: 8px 0; color: #DC2626; font-size: 16px; font-weight: bold;">₹ ${pendingAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Due Date:</strong></td>
                <td style="padding: 4px 0; font-weight: bold; color: #B45309;">${dueDate}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
            Kindly deposit the pending fees on or before the due date to avoid late submission fees. You can complete the payment at the school accounts desk or through official portal channels.
          </p>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rmsps.edu'}/parent/fees" style="display: inline-block; background-color: #3E5C76; color: #ffffff; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: bold; margin-top: 14px; font-size: 13px;">
            View Fee Details & History
          </a>
        </div>
        ${getSchoolFooterHtml()}
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending fee reminder email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

/* ══════════════════════════════════════════════════════════════
   4. FEE RECEIPT EMAIL (WITH PDF ATTACHMENT)
   ══════════════════════════════════════════════════════════════ */
export interface FeeReceiptEmailParams {
  toEmail: string
  parentName: string
  studentName: string
  className: string
  feeName: string
  amountPaid: number
  receiptNo: string
  paymentDate: string
  pdfBuffer: Buffer
}

export async function sendFeeReceiptEmail({
  toEmail,
  parentName,
  studentName,
  className,
  feeName,
  amountPaid,
  receiptNo,
  paymentDate,
  pdfBuffer,
}: FeeReceiptEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping fee receipt email.')
    return { success: false, error: 'SMTP not configured' }
  }

  const mailOptions = {
    from: `"RMSPS Accounts Desk" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Fee Payment Receipt #${receiptNo} - ${studentName} - RMSPS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        ${getSchoolHeaderHtml('Official Fee Payment Receipt', 'Payment Confirmation')}
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">Dear <strong>${parentName || 'Parent / Guardian'}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            We gratefully acknowledge receipt of your fee payment for <strong>${studentName}</strong> (${className}).
          </p>

          <div style="background-color: #ECFDF5; border: 1.5px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="color: #059669; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 10px;">
              ✓ PAYMENT SUCCESSFUL
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #0F172A;">
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Receipt No:</strong></td>
                <td style="padding: 4px 0; font-family: monospace; font-weight: bold;">${receiptNo}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Particular:</strong></td>
                <td style="padding: 4px 0;">${feeName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Amount Deposited:</strong></td>
                <td style="padding: 4px 0; font-weight: bold; color: #059669; font-size: 16px;">₹ ${amountPaid.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Date of Payment:</strong></td>
                <td style="padding: 4px 0;">${paymentDate}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
            The official computer-generated Fee Receipt has been generated and is attached to this email as a PDF document (<strong>${receiptNo}.pdf</strong>). Please preserve it for your accounting and examination records.
          </p>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rmsps.edu'}/parent/fees" style="display: inline-block; background-color: #3E5C76; color: #ffffff; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: bold; margin-top: 14px; font-size: 13px;">
            Open Parent Fee Portal
          </a>
        </div>
        ${getSchoolFooterHtml()}
      </div>
    `,
    attachments: [
      {
        filename: `RMSPS_Fee_Receipt_${receiptNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending fee receipt email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

/* ══════════════════════════════════════════════════════════════
   5. TEACHER PAYMENT / SALARY SLIP (WITH PDF ATTACHMENT)
   ══════════════════════════════════════════════════════════════ */
export interface TeacherPaymentEmailParams {
  toEmail: string
  teacherName: string
  amount: number
  paymentDate: string
  remarks?: string
  voucherNo: string
  pdfBuffer: Buffer
}

export async function sendTeacherPaymentEmail({
  toEmail,
  teacherName,
  amount,
  paymentDate,
  remarks,
  voucherNo,
  pdfBuffer,
}: TeacherPaymentEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping teacher payment email.')
    return { success: false, error: 'SMTP not configured' }
  }

  const mailOptions = {
    from: `"RMSPS Accounts Desk" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Payment Advice #${voucherNo} - RMSPS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        ${getSchoolHeaderHtml('Salary & Compensation Advice', 'RMSPS Finance & Accounts')}
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">Dear <strong>${teacherName}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            We are pleased to inform you that your salary / honorarium payment has been processed and credited to your account.
          </p>

          <div style="background-color: #F0FDF4; border: 1.5px solid #22C55E; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #15803D; font-weight: bold; text-transform: uppercase;">
              Payment Advice Summary
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #0F172A;">
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Voucher No:</strong></td>
                <td style="padding: 4px 0; font-family: monospace; font-weight: bold;">${voucherNo}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Net Amount:</strong></td>
                <td style="padding: 4px 0; font-weight: bold; color: #15803D; font-size: 16px;">₹ ${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Disbursement Date:</strong></td>
                <td style="padding: 4px 0;">${paymentDate}</td>
              </tr>
              ${remarks ? `
              <tr>
                <td style="padding: 4px 0; color: #64748B;"><strong>Remarks:</strong></td>
                <td style="padding: 4px 0;">${remarks}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
            Your detailed payment slip has been attached to this email as a PDF document (<strong>${voucherNo}.pdf</strong>). For any questions regarding deductions or calculations, please get in touch with the school accounts department.
          </p>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rmsps.edu'}/teacher" style="display: inline-block; background-color: #3E5C76; color: #ffffff; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: bold; margin-top: 14px; font-size: 13px;">
            Go to Teacher Portal
          </a>
        </div>
        ${getSchoolFooterHtml()}
      </div>
    `,
    attachments: [
      {
        filename: `RMSPS_Salary_Advice_${voucherNo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending teacher payment email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

/* ══════════════════════════════════════════════════════════════
   6. TEACHER ABSENT ALERT
   ══════════════════════════════════════════════════════════════ */
export interface TeacherAbsentAlertParams {
  toEmail: string
  teacherName: string
  date: string
}

export async function sendTeacherAbsentAlertEmail({
  toEmail,
  teacherName,
  date,
}: TeacherAbsentAlertParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping teacher absent email.')
    return { success: false, error: 'SMTP not configured' }
  }

  const mailOptions = {
    from: `"RMSPS Administration" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Attendance Notice: Absence Recorded on ${date} - RMSPS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        ${getSchoolHeaderHtml('Teacher Attendance Notification', 'Faculty Operations')}
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">Dear <strong>${teacherName}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            This is an automated notification from the school attendance system. Your attendance for <strong>${date}</strong> has been recorded as <strong>ABSENT</strong> in the school register.
          </p>

          <div style="background-color: #FEF2F2; border: 1.5px solid #F87171; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #991B1B; font-weight: bold;">
              Absence Record Confirmation
            </p>
            <p style="margin: 0; font-size: 14px; color: #7F1D1D;">
              If you have already submitted an approved leave request, this will be reconciled automatically. If this record is in error, please contact the Principal / Admin desk to regularize your attendance.
            </p>
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rmsps.edu'}/teacher/attendance" style="display: inline-block; background-color: #3E5C76; color: #ffffff; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: bold; margin-top: 10px; font-size: 13px;">
            Check Teacher Attendance
          </a>
        </div>
        ${getSchoolFooterHtml()}
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending teacher absent alert email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

/* ══════════════════════════════════════════════════════════════
   7. PASSWORD CHANGED SECURITY ALERT
   ══════════════════════════════════════════════════════════════ */
export interface PasswordChangedAlertParams {
  toEmail: string
  userName: string
  changedAt?: string
}

export async function sendPasswordChangedAlertEmail({
  toEmail,
  userName,
  changedAt,
}: PasswordChangedAlertParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping password changed email.')
    return { success: false, error: 'SMTP not configured' }
  }

  const timestamp = changedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

  const mailOptions = {
    from: `"RMSPS Security" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Security Alert: Your RMSPS Account Password Was Changed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        ${getSchoolHeaderHtml('Account Security Alert', 'RMSPS User Protection')}
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            The password for your Residential Maa Saraswati Public School portal account (<strong>${toEmail}</strong>) was successfully changed on <strong>${timestamp}</strong>.
          </p>

          <div style="background-color: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #0F172A; font-weight: bold;">
              Didn't make this change?
            </p>
            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
              If you did not initiate this change, your account may have been compromised. Please reset your password immediately or contact the school IT / Administration office.
            </p>
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rmsps.edu'}/forgot-password" style="display: inline-block; background-color: #DC2626; color: #ffffff; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: bold; margin-top: 10px; font-size: 13px;">
            Reset Password Now
          </a>
        </div>
        ${getSchoolFooterHtml()}
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending password changed email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

/* ══════════════════════════════════════════════════════════════
   8. NOTICE BOARD ANNOUNCEMENT EMAIL
   ══════════════════════════════════════════════════════════════ */
export interface NoticeAlertEmailParams {
  toEmails: string[]
  title: string
  content: string
  targetRole: string
  noticeDate?: string
}

export async function sendNoticeAlertEmail({
  toEmails,
  title,
  content,
  targetRole,
  noticeDate,
}: NoticeAlertEmailParams): Promise<{ success: boolean; sentCount: number; error?: string }> {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping notice alert email.')
    return { success: false, sentCount: 0, error: 'SMTP not configured' }
  }

  if (!toEmails || toEmails.length === 0) {
    return { success: true, sentCount: 0 }
  }

  const validEmails = Array.from(new Set(toEmails.filter(Boolean)))
  const dateStr = noticeDate || new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

  const mailOptions = {
    from: `"RMSPS Notice Desk" <${process.env.SMTP_EMAIL}>`,
    bcc: validEmails,
    subject: `[RMSPS Notice] ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        ${getSchoolHeaderHtml('Official Notice & Announcement', `Circulated to: ${targetRole.toUpperCase()}`)}
        <div style="padding: 32px; background-color: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 18px;">
            <h2 style="font-size: 18px; color: #0B0B10; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              ${title}
            </h2>
          </div>

          <div style="margin-bottom: 16px;">
            <span style="font-size: 12px; color: #64748B; background-color: #F1F5F9; padding: 4px 10px; border-radius: 4px;">
              Date: ${dateStr}
            </span>
          </div>

          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 22px; font-size: 14px; color: #1E293B; line-height: 1.7; white-space: pre-wrap;">
${content}
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rmsps.edu'}/notices" style="display: inline-block; background-color: #3E5C76; color: #ffffff; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: bold; margin-top: 20px; font-size: 13px;">
            View Full Notice Board
          </a>
        </div>
        ${getSchoolFooterHtml()}
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true, sentCount: validEmails.length }
  } catch (error: unknown) {
    console.error('Error sending notice alert email:', error)
    return { success: false, sentCount: 0, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}
