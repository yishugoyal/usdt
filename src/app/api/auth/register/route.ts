import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, mobile, password, fullName } = body;

    if (!email || !mobile || !password || !fullName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { mobile }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or mobile number already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        mobile,
        passwordHash,
        isEmailVerified: true, // Auto-verify in sandbox
        isMobileVerified: true,
        profile: {
          create: {
            fullName,
            country: 'IN',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully',
      userId: user.id,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
