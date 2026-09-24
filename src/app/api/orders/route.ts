import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { OrderStateMachine } from '@/lib/engine/state-machine';
import { ProviderFactory } from '@/lib/providers/adapters/ProviderFactory';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orders = await prisma.sellOrder.findMany({
      where: { userId: user.id },
      include: {
        network: true,
        bankAccount: true,
        payouts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { quoteId, bankAccountId } = await req.json();

    if (!quoteId || !bankAccountId) {
      return NextResponse.json({ error: 'quoteId and bankAccountId are required' }, { status: 400 });
    }

    const quote = await prisma.rateQuote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    if (new Date() > new Date(quote.expiresAt)) {
      return NextResponse.json({ error: 'Quote has expired. Please request a fresh quote.' }, { status: 400 });
    }

    const network = await prisma.network.findFirst({
      where: { name: quote.networkName },
    });

    if (!network) return NextResponse.json({ error: 'Network configuration error' }, { status: 404 });

    const orderNumber = 'RB-' + Date.now().toString().slice(-8);

    // Generate deposit address via Blockchain Provider
    const blockchainProvider = ProviderFactory.getBlockchainProvider();
    const depositInfo = await blockchainProvider.generateDepositAddress(orderNumber, network.name);

    const order = await prisma.sellOrder.create({
      data: {
        orderNumber,
        userId: user.id,
        bankAccountId,
        quoteId: quote.id,
        networkId: network.id,
        usdtAmount: quote.usdtAmount,
        inrRate: quote.netInrRate,
        grossInrAmount: quote.grossInrAmount,
        feeInrAmount: quote.companyFee,
        netInrAmount: quote.netInrAmount,
        state: 'AWAITING_DEPOSIT',
        depositAddress: depositInfo.address,
        depositAddresses: {
          create: {
            networkId: network.id,
            address: depositInfo.address,
            expiresAt: depositInfo.expiresAt,
          },
        },
      },
      include: {
        network: true,
        bankAccount: true,
      },
    });

    // Mark quote as used
    await prisma.rateQuote.update({
      where: { id: quote.id },
      data: { isUsed: true },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
