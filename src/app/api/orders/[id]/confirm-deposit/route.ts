import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ProviderFactory } from '@/lib/providers/adapters/ProviderFactory';
import { RiskEngine } from '@/lib/engine/risk-engine';
import { LedgerEngine } from '@/lib/engine/ledger-engine';
import { toDecimal } from '@/lib/decimal';
import { OrderStateMachine } from '@/lib/engine/state-machine';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mockTxHash = body.txHash || '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const order = await prisma.sellOrder.findUnique({
      where: { id: params.id },
      include: { network: true, bankAccount: true, user: true },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Step 1: Blockchain Verification
    const blockchainProvider = ProviderFactory.getBlockchainProvider();
    const verification = await blockchainProvider.verifyTransaction(mockTxHash, order.network.name);

    // Save Blockchain transaction record
    const btx = await prisma.blockchainTransaction.create({
      data: {
        orderId: order.id,
        networkId: order.networkId,
        txHash: verification.txHash,
        fromAddress: verification.fromAddress,
        toAddress: verification.toAddress,
        amount: order.usdtAmount,
        confirmations: verification.confirmations,
        status: 'CONFIRMED',
        blockNumber: BigInt(verification.blockNumber),
        confirmedAt: new Date(),
      },
    });

    // Step 2: Risk Engine Analysis
    const riskResult = await RiskEngine.evaluateOrderRisk(order.id);

    if (riskResult.requiresReview) {
      await prisma.sellOrder.update({
        where: { id: order.id },
        data: {
          state: 'RISK_REVIEW',
          txHash: verification.txHash,
        },
      });

      return NextResponse.json({
        success: true,
        orderState: 'RISK_REVIEW',
        message: 'Your deposit was detected. The transaction requires additional compliance review.',
      });
    }

    // Step 3: Financial Ledger Double-Entry Recording
    const usdtAmt = toDecimal(order.usdtAmount);
    const netInr = toDecimal(order.netInrAmount);
    const feeInr = toDecimal(order.feeInrAmount);

    await LedgerEngine.recordDepositConfirmed(order.id, usdtAmt, netInr, feeInr);

    // Step 4: Initiate INR Payout
    const payoutNumber = 'PO-' + Date.now().toString().slice(-8);
    const payoutProvider = ProviderFactory.getPayoutProvider();

    const payoutRes = await payoutProvider.initiatePayout({
      payoutNumber,
      orderNumber: order.orderNumber,
      beneficiaryName: order.bankAccount.accountHolderName,
      accountNumber: order.bankAccount.accountNumberEncrypted,
      ifscCode: order.bankAccount.ifscCode,
      amountInr: netInr,
    });

    const payoutRecord = await prisma.payout.create({
      data: {
        payoutNumber,
        orderId: order.id,
        bankAccountId: order.bankAccountId,
        amount: netInr.toFixed(4),
        provider: payoutProvider.name,
        providerReference: payoutRes.providerReference,
        status: 'COMPLETED',
        initiatedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Clear Ledger Liability for Payout
    await LedgerEngine.recordPayoutDisbursed(order.id, netInr);

    // Update order to COMPLETED
    const updatedOrder = await prisma.sellOrder.update({
      where: { id: order.id },
      data: {
        state: 'COMPLETED',
        txHash: verification.txHash,
        confirmedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Create User Notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Payout Completed! 🎉',
        message: `INR ${netInr.toFixed(2)} has been successfully transferred to your ${order.bankAccount.bankName} account for Order ${order.orderNumber}.`,
        type: 'SUCCESS',
      },
    });

    return NextResponse.json({
      success: true,
      orderState: 'COMPLETED',
      order: updatedOrder,
      payout: payoutRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
