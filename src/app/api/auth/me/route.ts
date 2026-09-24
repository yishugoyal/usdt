import { NextResponse } from 'next/server';
import { getCurrentUser, getCurrentStaff } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const requestedRole = url.searchParams.get('role');

  const staff = await getCurrentStaff();
  const user = await getCurrentUser();

  if (requestedRole === 'staff') {
    if (staff) {
      const dbStaff = await prisma.staffUser.findUnique({
        where: { id: staff.id },
        select: { id: true, email: true, name: true, role: true },
      });
      return NextResponse.json({ type: 'STAFF', user: dbStaff });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (requestedRole === 'user') {
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true, bankAccounts: true },
      });
      return NextResponse.json({ type: 'USER', user: dbUser });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // If user is present, prioritize USER for customer dashboard, but indicate staff status
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true, bankAccounts: true },
    });
    return NextResponse.json({ type: 'USER', user: dbUser, hasStaffSession: !!staff });
  }

  if (staff) {
    const dbStaff = await prisma.staffUser.findUnique({
      where: { id: staff.id },
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json({ type: 'STAFF', user: dbStaff });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
