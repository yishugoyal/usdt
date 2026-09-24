import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStaff } from '@/lib/auth';
import { ReconciliationEngine } from '@/lib/engine/reconciliation';

export async function GET() {
  try {
    const staff = await getCurrentStaff();
    if (!staff) return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });

    const records = await prisma.reconciliationRecord.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    });

    const ledgerEntries = await prisma.ledgerEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, records, ledgerEntries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const staff = await getCurrentStaff();
    if (!staff) return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });

    await ReconciliationEngine.runDailyReconciliation();

    return NextResponse.json({ success: true, message: 'Daily financial reconciliation executed successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
