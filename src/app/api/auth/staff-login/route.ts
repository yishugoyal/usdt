import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const staff = await prisma.staffUser.findUnique({
      where: { email },
    });

    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: 'Invalid admin credentials or account inactive' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, staff.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const token = await signToken({
      staffId: staff.id,
      email: staff.email,
      role: staff.role,
      type: 'STAFF',
    });

    const response = NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
      },
    });

    response.cookies.set('rb_staff_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
