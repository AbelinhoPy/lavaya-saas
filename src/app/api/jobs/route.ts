import { NextRequest, NextResponse } from 'next/server';
import { account, originCheck, fail, boundedJSON } from '@/lib/server';
import { validJob, states, canAdvance, generateJobToken, JobState, PaymentMethod } from '@/lib/jobs';
import { hasAccess } from '@/lib/billing-core';
import { query } from '@/lib/db';

async function access() {
  const a = await account();
  const subRows = await query(
    'SELECT status, access_until FROM public.subscriptions WHERE business_id = $1 LIMIT 1',
    [a.business.id]
  );
  const sub = subRows[0];

  // If billing is enabled in production, enforce active subscription
  if (process.env.BILLING_ENABLED === 'true' && !hasAccess(sub)) {
    throw new Error('Tu suscripción no tiene un período activo. Activá tu prueba de 7 días.');
  }

  return a;
}

export async function GET(req: NextRequest) {
  try {
    const a = await access();
    const rows = await query(
      `SELECT id, plate, tipo, marca, service, extras, amount, state, payment_method, token_publico, 
              notas, cliente_nombre, cliente_telefono, inicio_lavado, listo_en, entregado_en, created_at 
       FROM public.wash_jobs 
       WHERE business_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [a.business.id]
    );
    return NextResponse.json({ jobs: rows });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    originCheck(req);
    const a = await access();
    const b = await boundedJSON(req);

    if (!validJob(b)) {
      throw new Error('Datos inválidos. Revisá placa, servicio e importe.');
    }

    const token = generateJobToken();
    const extrasJson = JSON.stringify(Array.isArray(b.extras) ? b.extras : []);
    const tipo = b.tipo === 'moto' ? 'moto' : 'auto';
    const plate = b.plate.trim().toUpperCase();

    // 1. Save or update frequent vehicle in vehicles table for this business
    await query(
      `INSERT INTO public.vehicles (business_id, plate, tipo, marca, color, cliente_nombre, cliente_telefono)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (business_id, plate) DO UPDATE SET
         tipo = EXCLUDED.tipo,
         marca = COALESCE(EXCLUDED.marca, public.vehicles.marca),
         cliente_nombre = COALESCE(EXCLUDED.cliente_nombre, public.vehicles.cliente_nombre),
         cliente_telefono = COALESCE(EXCLUDED.cliente_telefono, public.vehicles.cliente_telefono)`,
      [
        a.business.id,
        plate,
        tipo,
        b.marca ? String(b.marca).trim() : null,
        b.color ? String(b.color).trim() : null,
        b.cliente_nombre ? String(b.cliente_nombre).trim() : null,
        b.cliente_telefono ? String(b.cliente_telefono).trim() : null,
      ]
    );

    // 2. Insert wash job
    const rows = await query(
      `INSERT INTO public.wash_jobs 
        (business_id, plate, tipo, marca, service, extras, amount, state, payment_method, token_publico, notas, cliente_nombre, cliente_telefono)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, 'espera', NULL, $8, $9, $10, $11)
       RETURNING id, plate, tipo, marca, service, extras, amount, state, payment_method, token_publico, notas, cliente_nombre, cliente_telefono, created_at`,
      [
        a.business.id,
        plate,
        tipo,
        b.marca ? String(b.marca).trim() : null,
        b.service.trim(),
        extrasJson,
        b.amount,
        token,
        b.notas ? String(b.notas).trim() : null,
        b.cliente_nombre ? String(b.cliente_nombre).trim() : null,
        b.cliente_telefono ? String(b.cliente_telefono).trim() : null,
      ]
    );

    return NextResponse.json({ job: rows[0] });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    originCheck(req);
    const a = await access();
    const b = await boundedJSON(req);

    if (
      typeof b.id !== 'string' ||
      !states.includes(b.state) ||
      b.state === 'espera' ||
      (b.state === 'entregado' && !['efectivo', 'transferencia', 'pendiente'].includes(b.payment_method))
    ) {
      throw new Error('Datos inválidos.');
    }

    const nextState = b.state as JobState;
    const prevState = states[states.indexOf(nextState) - 1];

    // Find job for this business and ensure previous state matches
    const jobRows = await query(
      `SELECT id, state, amount, plate FROM public.wash_jobs WHERE id = $1 AND business_id = $2 LIMIT 1`,
      [b.id, a.business.id]
    );

    const existingJob = jobRows[0];
    if (!existingJob) {
      throw new Error('El vehículo no existe o pertenece a otro lavadero.');
    }

    if (!canAdvance(existingJob.state, nextState)) {
      throw new Error('Transición de estado no permitida. Recargá el tablero.');
    }

    const paymentMethod = nextState === 'entregado' ? (b.payment_method as PaymentMethod) : null;

    // Update job state in Neon
    const updated = await query(
      `UPDATE public.wash_jobs 
       SET state = $1, payment_method = $2
       WHERE id = $3 AND business_id = $4 AND state = $5
       RETURNING id, plate, tipo, marca, service, extras, amount, state, payment_method, token_publico, notas, cliente_nombre, cliente_telefono, inicio_lavado, listo_en, entregado_en, created_at`,
      [nextState, paymentMethod, b.id, a.business.id, prevState]
    );

    if (updated.length === 0) {
      throw new Error('Datos inválidos. El estado cambió; recargá el tablero.');
    }

    const job = updated[0];

    // If marked as entregado with efectivo or transferencia, log to payments table
    if (nextState === 'entregado' && (paymentMethod === 'efectivo' || paymentMethod === 'transferencia')) {
      await query(
        `INSERT INTO public.payments (business_id, job_id, monto, medio)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [a.business.id, job.id, job.amount, paymentMethod]
      );
    }

    return NextResponse.json({ job });
  } catch (e) {
    return fail(e);
  }
}
