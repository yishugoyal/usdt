import { prisma } from '@/lib/prisma';
import { toDecimal, Decimal } from '@/lib/decimal';

export class LedgerEngine {
  static async recordDepositConfirmed(
    orderId: string,
    usdtAmount: Decimal,
    netInrAmount: Decimal,
    companyFeeInr: Decimal
  ): Promise<void> {
    const timestamp = new Date();
    const entryBaseNum = 'LE-' + Date.now();

    // 1. Debit DEPOSIT_HOLDING (USDT) / Credit PAYOUT_LIABILITY (Net INR)
    await prisma.ledgerEntry.create({
      data: {
        entryNumber: entryBaseNum + '-1',
        orderId,
        accountType: 'DEPOSIT_HOLDING',
        debit: usdtAmount.toFixed(4),
        credit: '0.00',
        description: `USDT Deposit confirmed for Order ${orderId}`,
        timestamp,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        entryNumber: entryBaseNum + '-2',
        orderId,
        accountType: 'USER_PAYOUT_LIABILITY',
        debit: '0.00',
        credit: netInrAmount.toFixed(4),
        description: `Net INR payout obligation for Order ${orderId}`,
        timestamp,
      },
    });

    // 2. Company Fee Entry -> Credit COMPANY_REVENUE
    await prisma.ledgerEntry.create({
      data: {
        entryNumber: entryBaseNum + '-3',
        orderId,
        accountType: 'COMPANY_REVENUE',
        debit: '0.00',
        credit: companyFeeInr.toFixed(4),
        description: `Platform service fee earned for Order ${orderId}`,
        timestamp,
      },
    });
  }

  static async recordPayoutDisbursed(orderId: string, netInrAmount: Decimal): Promise<void> {
    const timestamp = new Date();
    const entryNum = 'LE-PAYOUT-' + Date.now();

    await prisma.ledgerEntry.create({
      data: {
        entryNumber: entryNum + '-1',
        orderId,
        accountType: 'USER_PAYOUT_LIABILITY',
        debit: netInrAmount.toFixed(4),
        credit: '0.00',
        description: `INR Liability cleared via bank payout for Order ${orderId}`,
        timestamp,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        entryNumber: entryNum + '-2',
        orderId,
        accountType: 'PAYOUT_DISBURSED',
        debit: '0.00',
        credit: netInrAmount.toFixed(4),
        description: `Bank transfer settlement completed for Order ${orderId}`,
        timestamp,
      },
    });
  }
}
