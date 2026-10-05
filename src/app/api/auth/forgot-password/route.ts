import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/auth';
import { buildPasswordResetLink, sendTransactionalEmail } from '@/lib/email';
import { isRateLimited } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = normalizeEmail(String(email || ''));

    if (!normalizedEmail) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists for that email address, we have sent a password reset link.',
      });
    }

    const rateLimitKey = `reset:${normalizedEmail}`;
    if (isRateLimited(rateLimitKey, 3, 60 * 60 * 1000)) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists for that email address, we have sent a password reset link.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.status === 'ACTIVE') {
      const resetLink = await buildPasswordResetLink(user.id, user.email);
      await sendTransactionalEmail({
        to: user.email,
        subject: 'Reset your RupeeBridge password',
        text: `Reset your password: ${resetLink}`,
        html: `<p>Reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email address, we have sent a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email address, we have sent a password reset link.',
    });
  }
}
