import { NextRequest, NextResponse } from 'next/server';
import { account, originCheck, fail, boundedJSON } from '@/lib/server';
import { paddle } from '@/lib/paddle';
import { validPrice, getPriceIdForPlan, PlanType, PLANS } from '@/lib/billing-core';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    originCheck(req);
    const a = await account();
    const b = await boundedJSON(req);

    if (b.consent !== true) {
      throw new Error('Completá la autorización de renovación para continuar.');
    }

    const selectedPlan: PlanType = ['monthly', 'semiannual', 'annual'].includes(b.plan)
      ? (b.plan as PlanType)
      : 'monthly';

    const priceId = getPriceIdForPlan(selectedPlan);
    if (!priceId) {
      throw new Error(
        `Configuración de precio pendiente para el plan ${PLANS[selectedPlan].name}. El administrador debe configurar el ID de precio correspondiente en Paddle.`
      );
    }

    // Verify price settings from Paddle
    const price = await paddle(`/prices/${priceId}`);
    if (!validPrice(price, selectedPlan)) {
      throw new Error(
        `Configuración de precio incompatible para ${PLANS[selectedPlan].name}: debe incluir 7 días gratis con tarjeta y cobro exacto de US$${PLANS[selectedPlan].totalCharge}.`
      );
    }

    // Claim checkout in database to serialize and prevent abuse
    const claimRows = await query(
      `SELECT public.claim_checkout($1, $2) AS claimed`,
      [a.business.id, selectedPlan]
    );

    const claimed = claimRows[0]?.claimed;
    if (!claimed) {
      throw new Error('Esperá unos minutos antes de abrir otro checkout, o gestioná tu suscripción existente.');
    }

    // Create hosted transaction with Paddle
    const transaction = await paddle('/transactions', 'POST', {
      items: [{ price_id: priceId, quantity: 1 }],
      collection_mode: 'automatic',
      custom_data: {
        business_id: a.business.id,
        plan_type: selectedPlan,
      },
    });

    // Record transaction_id and consented timestamp in database
    await query(
      `UPDATE public.billing_checkouts
       SET transaction_id = $1, price_id = $2, plan_type = $3, consented_at = NOW()
       WHERE business_id = $4`,
      [transaction.id, priceId, selectedPlan, a.business.id]
    );

    return NextResponse.json({
      transactionId: transaction.id,
      plan: selectedPlan,
    });
  } catch (e) {
    return fail(e);
  }
}
