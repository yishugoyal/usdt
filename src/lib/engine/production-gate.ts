import { prisma } from '@/lib/prisma';

export interface GateStatus {
  canExecuteRealMoney: boolean;
  isSandboxMode: boolean;
  failedChecks: string[];
  passedCount: number;
  totalCount: number;
}

export class ProductionReadinessEngine {
  static async evaluateGate(): Promise<GateStatus> {
    const checks = await prisma.productionReadinessCheck.findMany();

    const isSandboxEnabled = process.env.ENABLE_SANDBOX_PROVIDERS === 'true';
    const isProdGateApproved = process.env.PRODUCTION_GATE_APPROVED === 'true';

    const failedChecks = checks
      .filter((c) => !c.isPassed)
      .map((c) => `[${c.category}] ${c.name}`);

    const canExecuteRealMoney = isProdGateApproved && failedChecks.length === 0;

    return {
      canExecuteRealMoney,
      isSandboxMode: isSandboxEnabled,
      failedChecks,
      passedCount: checks.filter((c) => c.isPassed).length,
      totalCount: checks.length,
    };
  }
}
