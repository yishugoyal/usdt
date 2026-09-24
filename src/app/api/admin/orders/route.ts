import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaff } from '@/lib/auth';

export async function GET() {
  try {
    const staff = await getCurrentStaff();
    if (!staff) return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });

    const orders = await prisma.sellOrder.findMany({
      include: {
        user: { select: { email: true, mobile: true, profile: true } },
        network: true,
        bankAccount: true,
        payouts: true,
        riskAlerts: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
