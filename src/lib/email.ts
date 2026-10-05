import nodemailer from 'nodemailer';
import { signToken } from '@/lib/auth';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export async function sendTransactionalEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@rupeebridge.local';

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn(`Email not sent to ${to}. SMTP configuration is incomplete.`);
    return { ok: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (error) {
    console.error('Email delivery failed:', error);
    return { ok: false, error: 'Unable to send the email. Please try again.' };
  }
}

export async function buildVerificationLink(userId: string, email: string): Promise<string> {
  const token = await signToken(
    {
      userId,
      email,
      type: 'USER',
      purpose: 'EMAIL_VERIFICATION',
    },
    '24h'
  );

  const url = new URL('/auth/callback', getBaseUrl());
  url.searchParams.set('purpose', 'verify-email');
  url.searchParams.set('token', token);
  return url.toString();
}

export async function buildPasswordResetLink(userId: string, email: string): Promise<string> {
  const token = await signToken(
    {
      userId,
      email,
      type: 'USER',
      purpose: 'PASSWORD_RESET',
    },
    '1h'
  );

  const url = new URL('/auth/callback', getBaseUrl());
  url.searchParams.set('purpose', 'reset-password');
  url.searchParams.set('token', token);
  return url.toString();
}
