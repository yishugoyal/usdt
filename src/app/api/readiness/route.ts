import { NextResponse } from 'next/server';
import { ProductionReadinessEngine } from '@/lib/engine/production-gate';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const gateStatus = await ProductionReadinessEngine.evaluateGate();
    const checks = await prisma.productionReadinessCheck.findMany({
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({
      success: true,
      gateStatus,
      checks,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
