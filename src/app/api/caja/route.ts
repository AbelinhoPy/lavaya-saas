import { NextRequest, NextResponse } from 'next/server';
import { account, fail } from '@/lib/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const a = await account();

    // Owner check: financial metrics are restricted to owner role
    if (a.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acceso privado para el dueño. Los operadores no tienen acceso a la caja.' },
        { status: 403 }
      );
    }

    // 1. Cobros de hoy (efectivo y transferencia)
    const paymentsSummary = await query(
      `SELECT 
         COALESCE(SUM(CASE WHEN medio = 'efectivo' THEN monto ELSE 0 END), 0) AS total_efectivo,
         COALESCE(SUM(CASE WHEN medio = 'transferencia' THEN monto ELSE 0 END), 0) AS total_transferencia,
         COALESCE(SUM(monto), 0) AS total_cobrado,
         COUNT(id) AS cantidad_cobros
       FROM public.payments
       WHERE business_id = $1 
         AND created_at >= CURRENT_DATE 
         AND medio IN ('efectivo', 'transferencia')`,
      [a.business.id]
    );

    // 2. Pendientes de cobro de hoy
    const pendingSummary = await query(
      `SELECT 
         COALESCE(SUM(amount), 0) AS total_pendiente,
         COUNT(id) AS cantidad_pendientes
       FROM public.wash_jobs
       WHERE business_id = $1 
         AND created_at >= CURRENT_DATE 
         AND payment_method = 'pendiente'`,
      [a.business.id]
    );

    // 3. Gastos de hoy
    const expensesSummary = await query(
      `SELECT 
         COALESCE(SUM(monto), 0) AS total_gastos,
         COUNT(id) AS cantidad_gastos
       FROM public.expenses
       WHERE business_id = $1 
         AND fecha = CURRENT_DATE`,
      [a.business.id]
    );

    // 4. Conteo de vehículos hoy
    const jobsCounts = await query(
      `SELECT 
         COUNT(CASE WHEN state = 'entregado' THEN 1 END) AS entregados,
         COUNT(CASE WHEN state IN ('espera', 'lavando', 'listo') THEN 1 END) AS en_pista
       FROM public.wash_jobs
       WHERE business_id = $1 
         AND created_at >= CURRENT_DATE`,
      [a.business.id]
    );

    // 5. Últimos movimientos de gastos
    const recentExpenses = await query(
      `SELECT id, concepto, monto, categoria, fecha, created_at
       FROM public.expenses
       WHERE business_id = $1 AND fecha = CURRENT_DATE
       ORDER BY created_at DESC
       LIMIT 20`,
      [a.business.id]
    );

    // 6. Últimos cobros registrados
    const recentPayments = await query(
      `SELECT p.id, p.monto, p.medio, p.created_at, j.plate, j.service
       FROM public.payments p
       JOIN public.wash_jobs j ON j.id = p.job_id
       WHERE p.business_id = $1 AND p.created_at >= CURRENT_DATE
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [a.business.id]
    );

    const totalCobrado = Number(paymentsSummary[0]?.total_cobrado || 0);
    const totalEfectivo = Number(paymentsSummary[0]?.total_efectivo || 0);
    const totalTransferencia = Number(paymentsSummary[0]?.total_transferencia || 0);
    const totalPendiente = Number(pendingSummary[0]?.total_pendiente || 0);
    const totalGastos = Number(expensesSummary[0]?.total_gastos || 0);
    const balanceOperativo = totalCobrado - totalGastos;

    return NextResponse.json({
      summary: {
        totalCobrado,
        totalEfectivo,
        totalTransferencia,
        totalPendiente,
        totalGastos,
        balanceOperativo,
        balanceLabel: 'Cobros menos gastos registrados',
        balanceDisclaimer: 'Balance de caja del día. No contempla costos fijos, alquiler ni sueldos no ingresados.',
        vehiculosEntregados: Number(jobsCounts[0]?.entregados || 0),
        vehiculosEnPista: Number(jobsCounts[0]?.en_pista || 0),
      },
      recentPayments,
      recentExpenses,
    });
  } catch (e) {
    return fail(e);
  }
}
