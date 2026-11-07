import { NextRequest, NextResponse } from 'next/server';
import { account, fail } from '@/lib/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getAsuncionDateString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

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

    const todayAsuncion = getAsuncionDateString();
    const searchParams = req.nextUrl.searchParams;
    const from = searchParams.get('from') || todayAsuncion;
    const to = searchParams.get('to') || from;

    // Validate YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const validFrom = dateRegex.test(from) ? from : todayAsuncion;
    const validTo = dateRegex.test(to) ? to : validFrom;

    // 1. Cobros efectivamente recibidos en el período (tanto efectivo como transferencia)
    // Nota clave: si un trabajo se creó ayer o antes pero se cobró hoy, su pago se asienta hoy
    const paymentsSummary = await query(
      `SELECT 
         COALESCE(SUM(CASE WHEN medio = 'efectivo' THEN monto ELSE 0 END), 0) AS total_efectivo,
         COALESCE(SUM(CASE WHEN medio = 'transferencia' THEN monto ELSE 0 END), 0) AS total_transferencia,
         COALESCE(SUM(monto), 0) AS total_cobrado,
         COUNT(id) AS cantidad_cobros
       FROM public.payments
       WHERE business_id = $1 
         AND (created_at AT TIME ZONE 'America/Asuncion')::date BETWEEN $2 AND $3
         AND medio IN ('efectivo', 'transferencia')`,
      [a.business.id, validFrom, validTo]
    );

    // 2. Pendientes TOTALES vigentes (todas las deudas acumuladas sin saldar, sin importar la fecha de ingreso)
    const allPendingSummary = await query(
      `SELECT 
         COALESCE(SUM(amount), 0) AS total_pendiente_vigente,
         COUNT(id) AS cantidad_pendientes_vigentes
       FROM public.wash_jobs
       WHERE business_id = $1 
         AND state = 'entregado'
         AND payment_method = 'pendiente'`,
      [a.business.id]
    );

    // 3. Pendientes originados específicamente en el período seleccionado
    const periodPendingSummary = await query(
      `SELECT 
         COALESCE(SUM(amount), 0) AS total_pendiente_periodo,
         COUNT(id) AS cantidad_pendientes_periodo
       FROM public.wash_jobs
       WHERE business_id = $1 
         AND state = 'entregado'
         AND payment_method = 'pendiente'
         AND (created_at AT TIME ZONE 'America/Asuncion')::date BETWEEN $2 AND $3`,
      [a.business.id, validFrom, validTo]
    );

    // 4. Gastos del período
    const expensesSummary = await query(
      `SELECT 
         COALESCE(SUM(monto), 0) AS total_gastos,
         COUNT(id) AS cantidad_gastos
       FROM public.expenses
       WHERE business_id = $1 
         AND fecha BETWEEN $2 AND $3`,
      [a.business.id, validFrom, validTo]
    );

    // 5. Conteo de vehículos:
    // - En pista actualmente (espera, lavando, listo): SIN límite de fecha (autos de ayer aún en pista se cuentan).
    // - Entregados en el período consultado.
    const jobsCounts = await query(
      `SELECT 
         COUNT(CASE WHEN state = 'entregado' AND (created_at AT TIME ZONE 'America/Asuncion')::date BETWEEN $2 AND $3 THEN 1 END) AS entregados_periodo,
         COUNT(CASE WHEN state IN ('espera', 'lavando', 'listo') THEN 1 END) AS en_pista_actual
       FROM public.wash_jobs
       WHERE business_id = $1`,
      [a.business.id, validFrom, validTo]
    );

    // 6. Lista de todos los vehículos con cobro pendiente vigente (para cobrar desde caja)
    const pendingJobsList = await query(
      `SELECT id, plate, tipo, marca, service, amount, state, payment_method, token_publico,
              cliente_nombre, cliente_telefono, created_at
       FROM public.wash_jobs
       WHERE business_id = $1 
         AND state = 'entregado'
         AND payment_method = 'pendiente'
       ORDER BY created_at ASC`,
      [a.business.id]
    );

    // 7. Últimos movimientos de gastos del período
    const recentExpenses = await query(
      `SELECT id, concepto, monto, categoria, fecha, created_at
       FROM public.expenses
       WHERE business_id = $1 AND fecha BETWEEN $2 AND $3
       ORDER BY created_at DESC
       LIMIT 30`,
      [a.business.id, validFrom, validTo]
    );

    // 8. Últimos cobros registrados en el período
    const recentPayments = await query(
      `SELECT p.id, p.monto, p.medio, p.created_at, j.plate, j.service
       FROM public.payments p
       JOIN public.wash_jobs j ON j.id = p.job_id
       WHERE p.business_id = $1 
         AND (p.created_at AT TIME ZONE 'America/Asuncion')::date BETWEEN $2 AND $3
       ORDER BY p.created_at DESC
       LIMIT 30`,
      [a.business.id, validFrom, validTo]
    );

    const totalCobrado = Number(paymentsSummary[0]?.total_cobrado || 0);
    const totalEfectivo = Number(paymentsSummary[0]?.total_efectivo || 0);
    const totalTransferencia = Number(paymentsSummary[0]?.total_transferencia || 0);
    const totalPendienteVigente = Number(allPendingSummary[0]?.total_pendiente_vigente || 0);
    const totalPendientePeriodo = Number(periodPendingSummary[0]?.total_pendiente_periodo || 0);
    const totalGastos = Number(expensesSummary[0]?.total_gastos || 0);
    const balanceOperativo = totalCobrado - totalGastos;

    return NextResponse.json({
      period: {
        from: validFrom,
        to: validTo,
        timezone: 'America/Asuncion',
      },
      summary: {
        totalCobrado,
        totalEfectivo,
        totalTransferencia,
        totalPendiente: totalPendienteVigente, // Total vigente para compatibilidad
        totalPendienteVigente,
        totalPendientePeriodo,
        totalGastos,
        balanceOperativo,
        balanceLabel: 'Cobros recibidos menos gastos del período',
        balanceDisclaimer: 'Flujo de caja del período. No contempla costos fijos, alquiler ni sueldos no ingresados.',
        vehiculosEntregados: Number(jobsCounts[0]?.entregados_periodo || 0),
        vehiculosEnPista: Number(jobsCounts[0]?.en_pista_actual || 0),
        cantidadPendientes: Number(allPendingSummary[0]?.cantidad_pendientes_vigentes || 0),
      },
      pendingJobs: pendingJobsList,
      recentPayments,
      recentExpenses,
    });
  } catch (e) {
    return fail(e);
  }
}
