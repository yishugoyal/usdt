import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * POST /api/webhooks/payout
 * 
 * Receives payout status webhooks from the banking/payout provider.
 * Implements:
 * - HMAC-SHA256 signature verification
 * - Replay protection via event ID uniqueness
 * - Idempotency
 * - Event persistence
 * - Dead-letter on unknown events
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-rb-signature') || '';
    const webhookSecret = process.env.PAYOUT_WEBHOOK_SECRET || '';

    // Signature verification (only enforce in production)
    if (process.env.NODE_ENV === 'production' && webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature.replace('sha256=', ''), 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        console.error('[WEBHOOK] Payout webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { eventId, eventType, data } = payload;

    if (!eventId || !eventType) {
      return NextResponse.json({ error: 'Missing eventId or eventType' }, { status: 400 });
    }

    // Idempotency: check for duplicate events
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      console.log(`[WEBHOOK] Duplicate payout event received: ${eventId}`);
      return NextResponse.json({ success: true, message: 'Duplicate event - already processed', duplicate: true });
    }

    // Persist the webhook event
    const webhookRecord = await prisma.webhookEvent.create({
      data: {
        provider: 'PAYOUT',
        eventId,
        eventType,
        payload: rawBody,
        signature,
        status: 'PENDING',
      },
    });

    let processingError: string | null = null;

    // Process known event types
    if (eventType === 'payout.completed' || eventType === 'transfer.success') {
      const { payoutNumber, providerReference, utrNumber } = data || {};

      if (payoutNumber) {
        const payout = await prisma.payout.findFirst({
          where: { payoutNumber },
          include: { order: { include: { user: true } } },
        });

        if (payout) {
          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              status: 'COMPLETED',
              providerReference: providerReference || payout.providerReference,
              completedAt: new Date(),
            },
          });

          // Update order state
          if (payout.order.state !== 'COMPLETED') {
            await prisma.sellOrder.update({
              where: { id: payout.orderId },
              data: {
                state: 'COMPLETED',
                completedAt: new Date(),
              },
            });
          }

          // Send user notification
          await prisma.notification.create({
            data: {
              userId: payout.order.userId,
              title: 'INR Payout Confirmed',
              message: `Your INR payout of ₹${payout.amount} has been confirmed by our banking partner${utrNumber ? `. UTR: ${utrNumber}` : ''}.`,
              type: 'SUCCESS',
            },
          });
        }
      }
    } else if (eventType === 'payout.failed' || eventType === 'transfer.failed') {
      const { payoutNumber, failureReason } = data || {};

      if (payoutNumber) {
        const payout = await prisma.payout.findFirst({ where: { payoutNumber } });
        if (payout) {
          await prisma.payout.update({
            where: { id: payout.id },
            data: { status: 'FAILED' },
          });

          await prisma.sellOrder.update({
            where: { id: payout.orderId },
            data: { state: 'PAYOUT_FAILED' },
          });

          // Alert for operations team
          await prisma.auditLog.create({
            data: {
              actorType: 'SYSTEM',
              actorId: 'PAYOUT_WEBHOOK',
              action: 'PAYOUT_FAILED_WEBHOOK',
              entityType: 'Payout',
              entityId: payout.id,
              details: JSON.stringify({ failureReason, eventId }),
            },
          });
        }
      }
    } else {
      // Unknown event - alert operations
      processingError = `Unknown payout event type: ${eventType}`;
      console.warn(`[WEBHOOK] Unknown payout event type received: ${eventType}`, { eventId });
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { id: webhookRecord.id },
      data: {
        status: processingError ? 'FAILED' : 'PROCESSED',
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, eventId, processed: !processingError });
  } catch (error: any) {
    console.error('[WEBHOOK] Payout webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
