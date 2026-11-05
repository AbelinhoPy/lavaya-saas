import { NextRequest, NextResponse } from 'next/server';
import { account, originCheck, fail } from '@/lib/server';
import { paddle } from '@/lib/paddle';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    originCheck(req);
    const a = await account();

    const subRows = await query(
      `SELECT paddle_customer_id, paddle_subscription_id 
       FROM public.subscriptions 
       WHERE business_id = $1 
       LIMIT 1`,
      [a.business.id]
    );

    const s = subRows[0];
    if (!s?.paddle_customer_id || !s?.paddle_subscription_id) {
      throw new Error('Tu suscripción todavía no está disponible.');
    }

    const portal = await paddle(`/customers/${s.paddle_customer_id}/portal-sessions`, 'POST', {
      subscription_ids: [s.paddle_subscription_id],
    });

    const url = portal.urls?.general?.overview;
    if (!url) {
      throw new Error('No pudimos generar el enlace del portal.');
    }

    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.paddle.com')) {
      throw new Error('No pudimos verificar el portal de pagos.');
    }

    return NextResponse.json({ url });
  } catch (e) {
    return fail(e);
  }
}
