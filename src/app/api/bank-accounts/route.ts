import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, bankAccounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bankName, accountNumber, ifscCode, accountHolderName } = await req.json();

    if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
      return NextResponse.json({ error: 'All bank account details required' }, { status: 400 });
    }

    // Mask account number
    const last4 = accountNumber.slice(-4);
    const masked = '••••••••' + last4;

    const bankAccount = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankName,
        accountHolderName: accountHolderName.toUpperCase(),
        accountNumberMasked: masked,
        accountNumberEncrypted: 'enc_' + last4,
        ifscCode: ifscCode.toUpperCase(),
        isVerified: true,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, bankAccount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
