import { NextRequest, NextResponse } from 'next/server';
import { account, originCheck, fail, boundedJSON } from '@/lib/server';
import { query, transaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    originCheck(req);
    const a = await account();

    // Financial security: Operators cannot inspect cash drawer or finances
    if (a.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acceso privado para el dueño. Los operadores no pueden consultar la sesión de caja.' },
        { status: 403 }
      );
    }

    // Check open cash session for this business
    const openRows = await query(
      `SELECT * FROM public.cash_sessions 
       WHERE business_id = $1 AND status = 'open' 
       ORDER BY opened_at DESC LIMIT 1`,
      [a.business.id]
    );

    let activeSession = openRows[0] || null;
    let expectedCash = 0;
    let cashSales = 0;
    let cashExpenses = 0;
    let cashDeposits = 0;
    let cashWithdrawals = 0;

    if (activeSession) {
      // 1. Cash sales: payments.monto WHERE medio = 'efectivo'
      const salesRes = await query(
        `SELECT COALESCE(SUM(monto), 0)::bigint AS total 
         FROM public.payments 
         WHERE business_id = $1 
           AND medio = 'efectivo' 
           AND created_at >= $2`,
        [a.business.id, activeSession.opened_at]
      );
      cashSales = Number(salesRes[0]?.total || 0);

      // 2. Cash expenses: expenses.monto WHERE tipo = 'gasto' AND medio_pago = 'efectivo'
      const expRes = await query(
        `SELECT COALESCE(SUM(monto), 0)::bigint AS total 
         FROM public.expenses 
         WHERE business_id = $1 
           AND (tipo IS NULL OR tipo = 'gasto')
           AND medio_pago = 'efectivo'
           AND created_at >= $2`,
        [a.business.id, activeSession.opened_at]
      );
      cashExpenses = Number(expRes[0]?.total || 0);

      // 3. Cash owner entries (aportes/entradas)
      const depRes = await query(
        `SELECT COALESCE(SUM(monto), 0)::bigint AS total 
         FROM public.expenses 
         WHERE business_id = $1 
           AND tipo = 'entrada_dueno'
           AND medio_pago = 'efectivo'
           AND created_at >= $2`,
        [a.business.id, activeSession.opened_at]
      );
      cashDeposits = Number(depRes[0]?.total || 0);

      // 4. Cash owner withdrawals (retiros del dueño)
      const withRes = await query(
        `SELECT COALESCE(SUM(monto), 0)::bigint AS total 
         FROM public.expenses 
         WHERE business_id = $1 
           AND tipo = 'retiro_dueno'
           AND medio_pago = 'efectivo'
           AND created_at >= $2`,
        [a.business.id, activeSession.opened_at]
      );
      cashWithdrawals = Number(withRes[0]?.total || 0);

      // Formula: Fondo inicial + Cobros efectivo + Entradas efectivo - Gastos efectivo - Retiros efectivo
      expectedCash = Number(activeSession.fondo_inicial) + cashSales + cashDeposits - cashExpenses - cashWithdrawals;
    }

    // 5 most recent closed sessions for shift history
    const pastSessions = await query(
      `SELECT * FROM public.cash_sessions 
       WHERE business_id = $1 AND status = 'closed' 
       ORDER BY closed_at DESC LIMIT 5`,
      [a.business.id]
    );

    return NextResponse.json({
      session: activeSession
        ? {
            ...activeSession,
            cashSales,
            cashExpenses,
            cashDeposits,
            cashWithdrawals,
            expectedCash,
          }
        : null,
      history: pastSessions,
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    originCheck(req);
    const a = await account();

    if (a.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acceso exclusivo para el dueño. Los operadores no gestionan sesiones de caja.' },
        { status: 403 }
      );
    }

    const b = await boundedJSON(req);
    const action = b.action;

    if (action === 'abrir') {
      const fondoInicial = Math.max(0, Number(b.fondo_inicial) || 0);
      const notas = typeof b.notas === 'string' ? b.notas.slice(0, 300) : null;

      try {
        const rows = await query(
          `INSERT INTO public.cash_sessions (business_id, opened_by, fondo_inicial, notas, status)
           VALUES ($1, $2, $3, $4, 'open')
           RETURNING *`,
          [a.business.id, a.user.name || a.user.email, fondoInicial, notas]
        );
        return NextResponse.json({ session: rows[0] });
      } catch (err: any) {
        if (err.code === '23505' || err.message?.includes('idx_unique_open_cash_session')) {
          throw new Error('Ya existe una sesión de caja abierta en tu lavadero. Cerrá el turno actual antes de abrir uno nuevo.');
        }
        throw err;
      }
    }

    if (action === 'cerrar') {
      const efectivoContado = Math.max(0, Number(b.efectivo_contado) || 0);
      const notas = typeof b.notas === 'string' ? b.notas.slice(0, 300) : null;

      // Atomic close with row-level lock
      const result = await transaction(async (client) => {
        const existing = await client.query(
          `SELECT * FROM public.cash_sessions 
           WHERE business_id = $1 AND status = 'open' 
           FOR UPDATE`,
          [a.business.id]
        );

        if (existing.rows.length === 0) {
          throw new Error('No hay ninguna sesión de caja abierta para cerrar (o ya fue cerrada por otra solicitud).');
        }

        const session = existing.rows[0];

        // 1. Cash sales: payments.monto WHERE medio = 'efectivo'
        const salesRes = await client.query(
          `SELECT COALESCE(SUM(monto), 0)::bigint AS total 
           FROM public.payments 
           WHERE business_id = $1 
             AND medio = 'efectivo' 
             AND created_at >= $2`,
          [a.business.id, session.opened_at]
        );
        const cashSales = Number(salesRes.rows[0]?.total || 0);

        // 2. Cash expenses: expenses.monto WHERE tipo = 'gasto' AND medio_pago = 'efectivo'
        const expRes = await client.query(
          `SELECT COALESCE(SUM(monto), 0)::bigint AS total 
           FROM public.expenses 
           WHERE business_id = $1 
             AND (tipo IS NULL OR tipo = 'gasto')
             AND medio_pago = 'efectivo'
             AND created_at >= $2`,
          [a.business.id, session.opened_at]
        );
        const cashExpenses = Number(expRes.rows[0]?.total || 0);

        // 3. Cash owner deposits
        const depRes = await client.query(
          `SELECT COALESCE(SUM(monto), 0)::bigint AS total 
           FROM public.expenses 
           WHERE business_id = $1 
             AND tipo = 'entrada_dueno'
             AND medio_pago = 'efectivo'
             AND created_at >= $2`,
          [a.business.id, session.opened_at]
        );
        const cashDeposits = Number(depRes.rows[0]?.total || 0);

        // 4. Cash owner withdrawals
        const withRes = await client.query(
          `SELECT COALESCE(SUM(monto), 0)::bigint AS total 
           FROM public.expenses 
           WHERE business_id = $1 
             AND tipo = 'retiro_dueno'
             AND medio_pago = 'efectivo'
             AND created_at >= $2`,
          [a.business.id, session.opened_at]
        );
        const cashWithdrawals = Number(withRes.rows[0]?.total || 0);

        // Authoritative expected cash
        const expectedCash = Number(session.fondo_inicial) + cashSales + cashDeposits - cashExpenses - cashWithdrawals;
        const diferencia = efectivoContado - expectedCash;

        const updated = await client.query(
          `UPDATE public.cash_sessions 
           SET status = 'closed',
               closed_at = NOW(),
               efectivo_esperado = $2,
               efectivo_contado = $3,
               diferencia = $4,
               notas = COALESCE($5, notas)
           WHERE id = $1
           RETURNING *`,
          [session.id, expectedCash, efectivoContado, diferencia, notas]
        );

        return {
          session: updated.rows[0],
          resumen: {
            fondoInicial: Number(session.fondo_inicial),
            cobrosEfectivo: cashSales,
            gastosEfectivo: cashExpenses,
            entradasDueno: cashDeposits,
            retirosDueno: cashWithdrawals,
            efectivoEsperado: expectedCash,
            efectivoContado,
            diferencia,
          },
        };
      });

      return NextResponse.json(result);
    }

    throw new Error('Acción de sesión no reconocida.');
  } catch (e) {
    return fail(e);
  }
}
