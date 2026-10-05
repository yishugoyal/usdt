import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/auth';
import { buildVerificationLink, sendTransactionalEmail } from '@/lib/email';
import { isRateLimited } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = normalizeEmail(String(email || ''));

    if (!normalizedEmail) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists for that email address, a verification email has been sent.',
      });
    }

    const rateLimitKey = `verify:${normalizedEmail}`;
    if (isRateLimited(rateLimitKey, 3, 60 * 60 * 1000)) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists for that email address, a verification email has been sent.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && !user.isEmailVerified && user.status === 'ACTIVE') {
      const verificationLink = await buildVerificationLink(user.id, user.email);
      await sendTransactionalEmail({
        to: user.email,
        subject: 'Verify your RupeeBridge account',
        text: `Your verification link: ${verificationLink}`,
        html: `<p>Verify your account: <a href="${verificationLink}">${verificationLink}</a></p>`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email address, a verification email has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email address, a verification email has been sent.',
    });
  }
}
