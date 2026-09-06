import { supabaseAdmin } from '@/utils/supabase/admin'
import {
  sendAttendanceAlertEmail,
  sendFeeReceiptEmail,
  sendTeacherPaymentEmail,
  sendTeacherAbsentAlertEmail,
  sendPasswordChangedAlertEmail,
  sendNoticeAlertEmail,
} from '@/utils/mailer'
import {
  sendPushNotification,
  broadcastPushNotification,
} from '@/utils/web-push'
import {
  generateFeeReceiptPdfBuffer,
  generateTeacherPaymentPdfBuffer,
  numberToWords,
} from '@/utils/pdf-generator'

/* ══════════════════════════════════════════════════════════════
   1. CONTACT RESOLVERS
   ══════════════════════════════════════════════════════════════ */

export interface StudentParentContact {
  email: string | null
  parentUserId: string | null
  parentName: string
  studentName: string
  className: string
  studentId: string
  profileId: string
}

/**
 * Resolve student details and linked parent email/profile.
 * Works with either student UUID or custom student_id (e.g. STU-2026-001).
 */
export async function resolveStudentParentContact(
  studentIdentifier: string
): Promise<StudentParentContact | null> {
  try {
    // 1. Fetch student row
    let query = supabaseAdmin
      .from('students')
      .select(`
        id,
        student_id,
        profile_id,
        father_name,
        profiles ( full_name ),
        classes ( class_name, section )
      `)

    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        studentIdentifier
      )
    ) {
      query = query.eq('id', studentIdentifier)
    } else {
      query = query.eq('student_id', studentIdentifier)
    }

    const { data: student, error: studentErr } = await query.maybeSingle()
    if (studentErr || !student) {
      // Fallback: check if identifier is profile_id
      const { data: byProfile } = await supabaseAdmin
        .from('students')
        .select(`
          id,
          student_id,
          profile_id,
          father_name,
          profiles ( full_name ),
          classes ( class_name, section )
        `)
        .eq('profile_id', studentIdentifier)
        .maybeSingle()

      if (!byProfile) return null
      return await resolveStudentParentContact(byProfile.id)
    }

    const profileArr = Array.isArray(student.profiles)
      ? student.profiles
      : student.profiles
      ? [student.profiles]
      : []
    const classArr = Array.isArray(student.classes)
      ? student.classes
      : student.classes
      ? [student.classes]
      : []

    const studentName = profileArr[0]?.full_name || 'Student'
    const className = classArr[0]
      ? `${classArr[0].class_name} - ${classArr[0].section}`
      : 'RMSPS Student'

    // 2. Query linked parent via parent_students
    const { data: parentLink } = await supabaseAdmin
      .from('parent_students')
      .select('parent_id, parents ( id, profile_id )')
      .eq('student_id', student.id)
      .limit(1)
      .maybeSingle()

    let parentProfileId: string | null = null
    if (parentLink?.parents) {
      const parentObj = Array.isArray(parentLink.parents)
        ? parentLink.parents[0]
        : parentLink.parents
      parentProfileId = parentObj?.profile_id || null
    }

    // 3. Resolve parent email and name
    if (parentProfileId) {
      const { data: parentProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', parentProfileId)
        .maybeSingle()

      const { data: authUser } =
        await supabaseAdmin.auth.admin.getUserById(parentProfileId)

      if (authUser?.user?.email) {
        return {
          email: authUser.user.email,
          parentUserId: parentProfileId,
          parentName: parentProfile?.full_name || student.father_name || 'Parent',
          studentName,
          className,
          studentId: student.student_id,
          profileId: student.profile_id,
        }
      }
    }

    // Fallback: If no linked parent, try student's auth email
    const { data: studentAuth } = await supabaseAdmin.auth.admin.getUserById(
      student.profile_id
    )

    return {
      email: studentAuth?.user?.email || null,
      parentUserId: null,
      parentName: student.father_name || 'Parent / Guardian',
      studentName,
      className,
      studentId: student.student_id,
      profileId: student.profile_id,
    }
  } catch (err) {
    console.error('Error resolving student parent contact:', err)
    return null
  }
}

export interface TeacherContact {
  email: string | null
  teacherUserId: string | null
  teacherName: string
  teacherId: string
  qualification?: string
}

/**
 * Resolve teacher contact and profile information.
 */
export async function resolveTeacherContact(
  teacherIdentifier: string
): Promise<TeacherContact | null> {
  try {
    let query = supabaseAdmin
      .from('teachers')
      .select(`
        id,
        teacher_id,
        profile_id,
        qualification,
        profiles ( full_name )
      `)

    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        teacherIdentifier
      )
    ) {
      query = query.eq('id', teacherIdentifier)
    } else {
      query = query.eq('teacher_id', teacherIdentifier)
    }

    const { data: teacher, error } = await query.maybeSingle()
    if (error || !teacher) {
      // Check if identifier is profile_id
      const { data: byProfile } = await supabaseAdmin
        .from('teachers')
        .select(`
          id,
          teacher_id,
          profile_id,
          qualification,
          profiles ( full_name )
        `)
        .eq('profile_id', teacherIdentifier)
        .maybeSingle()

      if (!byProfile) return null
      return await resolveTeacherContact(byProfile.id)
    }

    const profileArr = Array.isArray(teacher.profiles)
      ? teacher.profiles
      : teacher.profiles
      ? [teacher.profiles]
      : []

    const teacherName = profileArr[0]?.full_name || 'Teacher'

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      teacher.profile_id
    )

    return {
      email: authUser?.user?.email || null,
      teacherUserId: teacher.profile_id,
      teacherName,
      teacherId: teacher.teacher_id,
      qualification: teacher.qualification || undefined,
    }
  } catch (err) {
    console.error('Error resolving teacher contact:', err)
    return null
  }
}

/**
 * Resolve all user emails and user IDs for a given role broadcast.
 */
export async function resolveTargetRoleContacts(
  targetRole: 'all' | 'teacher' | 'parent' | 'student'
): Promise<{ emails: string[]; userIds: string[] }> {
  try {
    let query = supabaseAdmin.from('profiles').select('id, role')
    if (targetRole !== 'all') {
      query = query.eq('role', targetRole)
    }

    const { data: profiles, error } = await query
    if (error || !profiles || profiles.length === 0) {
      return { emails: [], userIds: [] }
    }

    const userIds = profiles.map((p) => p.id)

    // Fetch auth users
    const { data: authUsersData } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const allAuthUsers = authUsersData?.users || []

    const userSet = new Set(userIds)
    const emails = allAuthUsers
      .filter((u) => userSet.has(u.id) && u.email)
      .map((u) => u.email as string)

    return { emails, userIds }
  } catch (err) {
    console.error('Error resolving target role contacts:', err)
    return { emails: [], userIds: [] }
  }
}

/* ══════════════════════════════════════════════════════════════
   2. ASYNC NOTIFICATION DISPATCHERS
   ══════════════════════════════════════════════════════════════ */

/**
 * Dispatches attendance alert (Email + Push) for absent or late student.
 */
export async function dispatchAttendanceAlert(params: {
  studentId: string
  date: string
  status: 'absent' | 'late'
  time?: string
}): Promise<void> {
  try {
    const contact = await resolveStudentParentContact(params.studentId)
    if (!contact) return

    const isAbsent = params.status === 'absent'
    const statusLabel = isAbsent ? 'Absent' : 'Late'

    // 1. Send Email Alert
    if (contact.email) {
      sendAttendanceAlertEmail({
        toEmail: contact.email,
        parentName: contact.parentName,
        studentName: contact.studentName,
        className: contact.className,
        date: params.date,
        status: params.status,
        time: params.time,
      }).catch((e) => console.warn('Attendance email delivery failed:', e))
    }

    // 2. Send Push Notification to Parent & Student
    const pushTargets = [contact.parentUserId, contact.profileId].filter(
      (id): id is string => Boolean(id)
    )

    if (pushTargets.length > 0) {
      sendPushNotification(pushTargets, {
        title: `Attendance Alert: ${statusLabel}`,
        body: `${contact.studentName} was marked ${statusLabel} today (${params.date}).`,
        url: '/parent/attendance',
        tag: `attendance-${params.studentId}-${params.date}`,
      }).catch((e) => console.warn('Attendance push failed:', e))
    }
  } catch (err) {
    console.warn('dispatchAttendanceAlert error:', err)
  }
}

/**
 * Dispatches fee payment receipt (Email with PDF attached + Push).
 */
export async function dispatchFeePaymentAlert(params: {
  feeId: string
  studentId: string
  feeName: string
  amount: number
  paidAmount: number
  paymentDate: string
}): Promise<void> {
  try {
    const contact = await resolveStudentParentContact(params.studentId)
    if (!contact) return

    const receiptNo = `RMSPS/REC/${new Date().getFullYear()}/${params.feeId.substring(0, 6).toUpperCase()}`
    const balanceAmount = Math.max(0, params.amount - params.paidAmount)
    const words = numberToWords(params.paidAmount)

    // 1. Generate Fee Receipt PDF Buffer
    const pdfBuffer = await generateFeeReceiptPdfBuffer({
      receiptNo,
      date: params.paymentDate,
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      studentName: contact.studentName,
      studentId: contact.studentId,
      className: contact.className,
      parentName: contact.parentName,
      feeName: params.feeName,
      totalAmount: params.amount,
      paidAmount: params.paidAmount,
      balanceAmount,
      status: balanceAmount === 0 ? 'paid' : 'partially paid',
      amountInWords: words,
      paymentMode: 'School Accounts / Portal',
    })

    // 2. Send Email with PDF
    if (contact.email) {
      sendFeeReceiptEmail({
        toEmail: contact.email,
        parentName: contact.parentName,
        studentName: contact.studentName,
        className: contact.className,
        feeName: params.feeName,
        amountPaid: params.paidAmount,
        receiptNo,
        paymentDate: params.paymentDate,
        pdfBuffer,
      }).catch((e) => console.warn('Fee receipt email failed:', e))
    }

    // 3. Send Push Notification
    const pushTargets = [contact.parentUserId, contact.profileId].filter(
      (id): id is string => Boolean(id)
    )

    if (pushTargets.length > 0) {
      sendPushNotification(pushTargets, {
        title: 'Fee Payment Received',
        body: `Payment of ₹${params.paidAmount.toFixed(2)} received for ${contact.studentName}. Receipt #${receiptNo} generated.`,
        url: '/parent/fees',
        tag: `fee-${params.feeId}`,
      }).catch((e) => console.warn('Fee push failed:', e))
    }
  } catch (err) {
    console.warn('dispatchFeePaymentAlert error:', err)
  }
}

/**
 * Dispatches teacher payment advice (Email with PDF attached + Push).
 */
export async function dispatchTeacherPaymentAlert(params: {
  paymentId: string
  teacherId: string
  amount: number
  paymentDate: string
  remarks?: string
}): Promise<void> {
  try {
    const contact = await resolveTeacherContact(params.teacherId)
    if (!contact) return

    const voucherNo = `RMSPS/PAY/${new Date().getFullYear()}/${params.paymentId.substring(0, 6).toUpperCase()}`
    const words = numberToWords(params.amount)

    // 1. Generate Salary Slip PDF Buffer
    const pdfBuffer = await generateTeacherPaymentPdfBuffer({
      voucherNo,
      paymentDate: params.paymentDate,
      teacherName: contact.teacherName,
      teacherId: contact.teacherId,
      qualification: contact.qualification,
      amount: params.amount,
      amountInWords: words,
      status: 'paid',
      remarks: params.remarks,
    })

    // 2. Send Email with PDF
    if (contact.email) {
      sendTeacherPaymentEmail({
        toEmail: contact.email,
        teacherName: contact.teacherName,
        amount: params.amount,
        paymentDate: params.paymentDate,
        remarks: params.remarks,
        voucherNo,
        pdfBuffer,
      }).catch((e) => console.warn('Teacher payment email failed:', e))
    }

    // 3. Send Push Notification
    if (contact.teacherUserId) {
      sendPushNotification([contact.teacherUserId], {
        title: 'Payment Advice Issued',
        body: `Salary / payment of ₹${params.amount.toFixed(2)} disbursed. Voucher #${voucherNo}.`,
        url: '/teacher',
        tag: `pay-${params.paymentId}`,
      }).catch((e) => console.warn('Teacher payment push failed:', e))
    }
  } catch (err) {
    console.warn('dispatchTeacherPaymentAlert error:', err)
  }
}

/**
 * Dispatches teacher absent notification (Email + Push).
 */
export async function dispatchTeacherAbsentAlert(params: {
  teacherId: string
  date: string
}): Promise<void> {
  try {
    const contact = await resolveTeacherContact(params.teacherId)
    if (!contact) return

    // 1. Email alert
    if (contact.email) {
      sendTeacherAbsentAlertEmail({
        toEmail: contact.email,
        teacherName: contact.teacherName,
        date: params.date,
      }).catch((e) => console.warn('Teacher absent email failed:', e))
    }

    // 2. Push alert
    if (contact.teacherUserId) {
      sendPushNotification([contact.teacherUserId], {
        title: 'Attendance Notice',
        body: `Your attendance for ${params.date} is recorded as Absent.`,
        url: '/teacher/attendance',
        tag: `teacher-absent-${params.date}`,
      }).catch((e) => console.warn('Teacher absent push failed:', e))
    }
  } catch (err) {
    console.warn('dispatchTeacherAbsentAlert error:', err)
  }
}

/**
 * Dispatches notice announcement alert (Email broadcast + Web Push).
 */
export async function dispatchNoticeAlert(params: {
  id?: string
  title: string
  content: string
  targetRole: 'all' | 'teacher' | 'parent' | 'student'
}): Promise<void> {
  try {
    const { emails } = await resolveTargetRoleContacts(params.targetRole)
    const noticeUrl = params.id ? `/notice/${params.id}` : '/'

    // 1. Send Email Broadcast
    if (emails.length > 0) {
      sendNoticeAlertEmail({
        toEmails: emails,
        title: params.title,
        content: params.content,
        targetRole: params.targetRole,
        noticeId: params.id,
      }).catch((e) => console.warn('Notice email broadcast failed:', e))
    }

    // 2. Send Push Broadcast (Tapping directly opens the public notice!)
    broadcastPushNotification(params.targetRole, {
      title: `[Notice] ${params.title}`,
      body: params.content.length > 120 ? `${params.content.substring(0, 117)}...` : params.content,
      url: noticeUrl,
      tag: `notice-${params.id || Date.now()}`,
    }).catch((e) => console.warn('Notice push broadcast failed:', e))
  } catch (err) {
    console.warn('dispatchNoticeAlert error:', err)
  }
}

/**
 * Dispatches password changed security alert (Email + Push).
 */
export async function dispatchPasswordChangedAlert(params: {
  userEmail: string
  userName: string
  userId?: string
}): Promise<void> {
  try {
    // 1. Email alert
    sendPasswordChangedAlertEmail({
      toEmail: params.userEmail,
      userName: params.userName,
    }).catch((e) => console.warn('Password changed email failed:', e))

    // 2. Push alert
    if (params.userId) {
      sendPushNotification([params.userId], {
        title: 'Security Alert',
        body: 'The password for your RMSPS account was recently updated.',
        url: '/login',
        tag: 'security-pwd',
      }).catch((e) => console.warn('Password changed push failed:', e))
    }
  } catch (err) {
    console.warn('dispatchPasswordChangedAlert error:', err)
  }
}
