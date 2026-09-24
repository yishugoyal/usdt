import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaff } from '@/lib/auth';

export async function GET() {
  try {
    const staff = await getCurrentStaff();
    if (!staff) return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });

    const riskAlerts = await prisma.riskAlert.findMany({
      include: {
        user: { select: { email: true, mobile: true } },
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const complianceCases = await prisma.complianceCase.findMany({
      include: {
        user: { select: { email: true, mobile: true } },
        order: true,
        reviewer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, riskAlerts, complianceCases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
