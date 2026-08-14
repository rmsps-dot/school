import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendParentCredentials(
  toEmail: string,
  parentName: string,
  studentName: string,
  passwordText: string
) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not configured. Skipping email send.');
    return { success: false, error: 'SMTP not configured' };
  }

  const mailOptions = {
    from: `"RMSPS Admissions" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `Your Parent Account Credentials for RMSPS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
          <img src="https://rmsps.vercel.app/icon-192.png" alt="RMSPS Logo" style="width: 64px; height: 64px; border-radius: 50%; margin-bottom: 12px; border: 2px solid white;" />
          <h2 style="color: white; margin: 0;">Welcome to RMSPS</h2>
        </div>
        <div style="padding: 32px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #334155;">Dear <strong>${parentName}</strong>,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">
            We are pleased to inform you that your child <strong>${studentName}</strong>'s admission request has been approved.
          </p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">
            A Parent Portal account has been automatically created for you. You can use this account to track attendance, homework, and communicate with teachers.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b;">Your Login Credentials:</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;"><strong>Email:</strong> ${toEmail}</p>
            <p style="margin: 0; font-size: 16px; color: #0f172a;"><strong>Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${passwordText}</span></p>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
            <em>Please log in and change your password as soon as possible for security reasons.</em>
          </p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" style="display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 16px;">
            Go to Login Portal
          </a>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} Residential Maa Saraswati Public School. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to send email' };
  }
}
