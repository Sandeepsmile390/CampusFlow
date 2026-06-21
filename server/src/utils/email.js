import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525', 10),
  auth: {
    user: process.env.EMAIL_USER || 'mock_user',
    pass: process.env.EMAIL_PASS || 'mock_pass',
  },
});

export async function sendEmail({ to, subject, html, text }) {
  try {
    const isMock = process.env.EMAIL_USER === 'mock_user' || !process.env.EMAIL_USER;

    if (isMock) {
      console.log(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
      console.log(`[MOCK EMAIL CONTENT]: ${text || html.substring(0, 100)}...`);
      return { messageId: 'mock-id-12345', success: true };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"University ERP" <noreply@university.edu>',
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Sent Successfully]: Message ID ${info.messageId}`);
    return { messageId: info.messageId, success: true };
  } catch (error) {
    console.error('Email dispatch failed:', error.message);
    return { success: false, error: error.message };
  }
}
