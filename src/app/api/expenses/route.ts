import { NextRequest, NextResponse } from 'next/server';
import { account, originCheck, fail, boundedJSON } from '@/lib/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    originCheck(req);
    const a = await account();

    if (a.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acceso privado para el dueño. Los operadores no pueden registrar gastos.' },
        { status: 403 }
      );
    }

    const b = await boundedJSON(req);
    const concepto = typeof b.concepto === 'string' ? b.concepto.trim() : '';
    const monto = Number(b.monto);
    const categoria = typeof b.categoria === 'string' ? b.categoria.trim() : 'insumos';

    if (concepto.length < 2 || concepto.length > 120) {
      throw new Error('El concepto del gasto debe tener entre 2 y 120 caracteres.');
    }

    if (!Number.isSafeInteger(monto) || monto <= 0 || monto > 100000000) {
      throw new Error('Ingresá un monto válido en guaraníes.');
    }

    const rows = await query(
      `INSERT INTO public.expenses (business_id, concepto, monto, categoria, fecha)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       RETURNING id, concepto, monto, categoria, fecha, created_at`,
      [a.business.id, concepto, monto, categoria]
    );

    return NextResponse.json({ expense: rows[0] });
  } catch (e) {
    return fail(e);
  }
}
