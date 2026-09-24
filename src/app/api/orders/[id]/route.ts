import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getCurrentStaff } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const staff = await getCurrentStaff();

    if (!user && !staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.sellOrder.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { email: true, mobile: true, profile: true } },
        network: true,
        bankAccount: true,
        payouts: true,
        blockchainTxs: true,
        riskAlerts: true,
        complianceCases: true,
        ledgerEntries: true,
      },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Ensure non-staff user can only see their own order
    if (user && !staff && order.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
