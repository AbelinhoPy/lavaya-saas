import { NextRequest, NextResponse } from 'next/server';
import { verifySignature, getPlanFromPriceId } from '@/lib/billing-core';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret || process.env.BILLING_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const raw = await req.text();
  if (raw.length > 250000) {
    return NextResponse.json({ error: 'Too large' }, { status: 413 });
  }

  const signatureHeader = req.headers.get('paddle-signature') || '';
  if (!verifySignature(raw, signatureHeader, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(raw);
    if (typeof event.event_type !== 'string' || !event.event_type.startsWith('subscription.')) {
      return NextResponse.json({ received: true });
    }

    const d = event.data;
    const allowedStatuses = ['trialing', 'active', 'past_due', 'paused', 'canceled'];

    if (
      !d ||
      typeof d.id !== 'string' ||
      !d.id.startsWith('sub_') ||
      !allowedStatuses.includes(d.status) ||
      !event.event_id ||
      !Number.isFinite(Date.parse(event.occurred_at))
    ) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    if (!Array.isArray(d.items) || d.items.length !== 1 || d.items[0]?.quantity !== 1) {
      return NextResponse.json({ error: 'Unexpected item configuration' }, { status: 400 });
    }

    const priceId = d.items[0]?.price?.id;
    const detectedPlan = getPlanFromPriceId(priceId);
    if (!detectedPlan) {
      return NextResponse.json({ error: 'Price ID not in allowed plans list' }, { status: 400 });
    }

    const end = d.current_billing_period?.ends_at || d.next_billed_at || null;
    let until = end && Number.isFinite(Date.parse(end)) ? end : null;

    const cancellation =
      d.scheduled_change?.action === 'cancel' ? d.scheduled_change.effective_at : null;
    if (until && cancellation && Date.parse(cancellation) < Date.parse(until)) {
      until = cancellation;
    }

    await query(
      `SELECT public.apply_billing_event($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        event.event_id,
        event.occurred_at,
        d.id,
        d.customer_id,
        d.transaction_id || null,
        d.status,
        until,
        priceId,
        detectedPlan,
      ]
    );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Billing Webhook Exception]', err);
    return NextResponse.json({ error: 'Event could not be processed' }, { status: 500 });
  }
}
