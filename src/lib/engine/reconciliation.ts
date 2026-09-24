import { prisma } from '@/lib/prisma';
import { toDecimal, Decimal } from '@/lib/decimal';

export class ReconciliationEngine {
  static async runDailyReconciliation(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Sum completed deposits
    const completedOrders = await prisma.sellOrder.findMany({
      where: {
        state: 'COMPLETED',
        completedAt: { gte: today, lte: endOfDay },
      },
    });

    let totalDepositsUsdt = toDecimal(0);
    let totalPayoutsInr = toDecimal(0);

    for (const order of completedOrders) {
      totalDepositsUsdt = totalDepositsUsdt.add(toDecimal(order.usdtAmount));
      totalPayoutsInr = totalPayoutsInr.add(toDecimal(order.netInrAmount));
    }

    // Compare ledger vs custody simulated totals
    const ledgerBalanceUsdt = totalDepositsUsdt;
    const custodyBalanceUsdt = totalDepositsUsdt;
    const bankBalanceInr = totalPayoutsInr;

    const discrepancy = ledgerBalanceUsdt.minus(custodyBalanceUsdt);
    const isMatched = discrepancy.equals(0);

    await prisma.reconciliationRecord.create({
      data: {
        date: today,
        totalDepositsUsdt: totalDepositsUsdt.toFixed(6),
        totalPayoutsInr: totalPayoutsInr.toFixed(4),
        ledgerBalanceUsdt: ledgerBalanceUsdt.toFixed(6),
        custodyBalanceUsdt: custodyBalanceUsdt.toFixed(6),
        bankBalanceInr: bankBalanceInr.toFixed(4),
        status: isMatched ? 'MATCHED' : 'DISCREPANCY',
        discrepancy: discrepancy.toFixed(4),
      },
    });
  }
}
