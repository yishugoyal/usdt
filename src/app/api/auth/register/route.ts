import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, normalizeEmail, validatePassword } from '@/lib/auth';
import { buildVerificationLink, sendTransactionalEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, mobile, password, fullName } = body;

    if (!email || !mobile || !password || !fullName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedMobile = String(mobile).trim();
    const passwordValidation = validatePassword(String(password));

    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { mobile: normalizedMobile }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or mobile number already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(String(password));

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        mobile: normalizedMobile,
        passwordHash,
        isEmailVerified: false,
        isMobileVerified: false,
        profile: {
          create: {
            fullName: String(fullName).trim(),
            country: 'IN',
          },
        },
      },
    });

    const verificationLink = await buildVerificationLink(user.id, user.email);
    const emailResult = await sendTransactionalEmail({
      to: user.email,
      subject: 'Verify your RupeeBridge account',
      text: `Welcome to RupeeBridge. Please verify your account by visiting: ${verificationLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color:#111827;">
          <h2>Verify your RupeeBridge account</h2>
          <p>Hi ${String(fullName).trim()},</p>
          <p>Thanks for creating your RupeeBridge account. Please verify your email address to continue.</p>
          <p><a href="${verificationLink}" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;">Verify Email</a></p>
          <p>If the button does not work, use this link: <a href="${verificationLink}">${verificationLink}</a></p>
        </div>
      `,
    });

    if (!emailResult.ok) {
      console.warn('Verification email could not be sent for new user.', user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your inbox to verify your email.',
      userId: user.id,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
