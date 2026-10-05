import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword, verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Reset token and password are required.' }, { status: 400 });
    }

    const payload = await verifyToken(String(token));
    if (!payload || payload.purpose !== 'PASSWORD_RESET' || payload.type !== 'USER' || !payload.userId) {
      return NextResponse.json({ error: 'The password reset link is invalid or has expired.' }, { status: 400 });
    }

    const passwordValidation = validatePassword(String(password));
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'The password reset link is invalid or has expired.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(String(password));
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('Password reset failed:', error);
    return NextResponse.json({ error: 'Your password could not be updated. Please request a new reset link.' }, { status: 500 });
  }
}
