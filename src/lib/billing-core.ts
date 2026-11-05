import { createHmac, timingSafeEqual } from 'node:crypto';
import { PLANS, type PlanType, type PlanConfig } from './plans';

export type { PlanType, PlanConfig };
export { PLANS };

export function verifySignature(raw: string, header: string, secret: string, now = Date.now()): boolean {
  if (!raw || !header || !secret) return false;
  const pairs = header.split(';').map((x) => x.trim().split('='));
  const ts = pairs.find((x) => x[0] === 'ts')?.[1];
  if (!ts || !/^\d+$/.test(ts) || Math.abs(now / 1000 - Number(ts)) > 5) return false;
  const expected = createHmac('sha256', secret).update(`${ts}:${raw}`).digest();
  return pairs
    .filter((x) => x[0] === 'h1')
    .some(([, sig]) => Boolean(sig && /^[a-f0-9]{64}$/i.test(sig) && timingSafeEqual(expected, Buffer.from(sig, 'hex'))));
}

export function hasAccess(
  subscription: { status: string; access_until: string | null } | null | undefined,
  now = Date.now()
): boolean {
  return Boolean(
    subscription &&
      ['active', 'trialing'].includes(subscription.status) &&
      subscription.access_until &&
      new Date(subscription.access_until).getTime() > now
  );
}

export function validPrice(price: any, plan: PlanType = 'monthly'): boolean {
  if (!price || price.status !== 'active') return false;
  if (price?.unit_price?.currency_code !== 'USD') return false;
  if (Array.isArray(price?.unit_price_overrides) && price.unit_price_overrides.length > 0) return false;

  const trial = price?.trial_period;
  if (!trial || trial.interval !== 'day' || trial.frequency !== 7 || trial.requires_payment_method !== true) {
    return false;
  }
  if (trial.unit_price || (Array.isArray(trial.unit_price_overrides) && trial.unit_price_overrides.length > 0)) {
    return false;
  }

  const expectedPlan = PLANS[plan];
  if (!expectedPlan) return false;

  if (price?.unit_price?.amount !== expectedPlan.totalCents) return false;

  const cycle = price?.billing_cycle;
  if (!cycle) return false;

  if (plan === 'monthly') {
    return cycle.interval === 'month' && cycle.frequency === 1;
  }
  if (plan === 'semiannual') {
    return cycle.interval === 'month' && cycle.frequency === 6;
  }
  if (plan === 'annual') {
    return (
      (cycle.interval === 'year' && cycle.frequency === 1) ||
      (cycle.interval === 'month' && cycle.frequency === 12)
    );
  }

  return false;
}

export function getPriceIdForPlan(plan: PlanType): string | undefined {
  if (plan === 'monthly') {
    return process.env.PADDLE_PRICE_ID_MONTHLY || process.env.PADDLE_PRICE_ID;
  }
  if (plan === 'semiannual') {
    return process.env.PADDLE_PRICE_ID_SEMIANNUAL;
  }
  if (plan === 'annual') {
    return process.env.PADDLE_PRICE_ID_ANNUAL;
  }
  return undefined;
}

export function getPlanFromPriceId(priceId: string): PlanType | null {
  if (!priceId) return null;
  const m = process.env.PADDLE_PRICE_ID_MONTHLY || process.env.PADDLE_PRICE_ID;
  const s = process.env.PADDLE_PRICE_ID_SEMIANNUAL;
  const a = process.env.PADDLE_PRICE_ID_ANNUAL;

  if (priceId === m) return 'monthly';
  if (priceId === s) return 'semiannual';
  if (priceId === a) return 'annual';
  return null;
}
