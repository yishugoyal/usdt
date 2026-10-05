import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const purpose = url.searchParams.get('purpose');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid-link', url.origin));
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.email || payload.type !== 'USER') {
    return NextResponse.redirect(new URL('/login?error=invalid-link', url.origin));
  }

  if (purpose === 'reset-password') {
    if (payload.purpose !== 'PASSWORD_RESET') {
      return NextResponse.redirect(new URL('/login?error=invalid-link', url.origin));
    }

    return NextResponse.redirect(new URL(`/reset-password?token=${encodeURIComponent(token)}`, url.origin));
  }

  if (purpose === 'verify-email') {
    if (payload.purpose !== 'EMAIL_VERIFICATION') {
      return NextResponse.redirect(new URL('/login?error=invalid-link', url.origin));
    }

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid-link', url.origin));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    return NextResponse.redirect(new URL('/login?verified=1', url.origin));
  }

  return NextResponse.redirect(new URL('/login?error=invalid-link', url.origin));
}
