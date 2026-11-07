import { NextRequest, NextResponse } from 'next/server';
import { account, originCheck, fail, boundedJSON } from '@/lib/server';
import { query, transaction } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    originCheck(req);
    const a = await account();

    if (a.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acceso reservado para el dueño del lavadero.' },
        { status: 403 }
      );
    }

    const b = await boundedJSON(req);
    const itemId = String(b.item_id || '');
    const cantidad = Number(b.cantidad);
    const costoUnitario = Number(b.costo_unitario);
    const rawMedio = String(b.medio_pago || b.pago || 'efectivo').toLowerCase().trim();
    const medioPago = rawMedio === 'transferencia' ? 'transferencia' : rawMedio === 'pendiente' ? 'pendiente' : 'efectivo';
    const proveedor = typeof b.proveedor === 'string' ? b.proveedor.trim().slice(0, 100) : null;
    const notas = typeof b.notas === 'string' ? b.notas.slice(0, 200).trim() : '';
    const idempotencyKey = typeof b.idempotency_key === 'string' && b.idempotency_key.trim()
      ? b.idempotency_key.trim().slice(0, 100)
      : null;

    if (!itemId) throw new Error('Seleccioná un insumo.');
    if (isNaN(cantidad) || cantidad <= 0) throw new Error('La cantidad comprada debe ser mayor a 0.');
    if (isNaN(costoUnitario) || costoUnitario < 0) throw new Error('El costo unitario debe ser válido.');

    const costoTotal = Math.round(cantidad * costoUnitario);

    // Fast check for idempotency before transaction
    if (idempotencyKey) {
      const existing = await query(
        `SELECT m.*, i.nombre as item_nombre
         FROM public.stock_movements m
         JOIN public.stock_items i ON i.id = m.item_id
         WHERE m.business_id = $1 AND m.idempotency_key = $2`,
        [a.business.id, idempotencyKey]
      );
      if (existing.length > 0) {
        return NextResponse.json({
          success: true,
          movement: existing[0],
          costoTotal: Number(existing[0].costo_total || 0),
          medioPago,
          idempotent: true,
          message: 'Compra ya registrada previamente.',
        });
      }
    }

    const result = await transaction(async (client) => {
      // 1. Fetch item with lock
      const itemRes = await client.query(
        `SELECT * FROM public.stock_items WHERE id = $1 AND business_id = $2 FOR UPDATE`,
        [itemId, a.business.id]
      );
      if (itemRes.rows.length === 0) {
        throw new Error('Insumo no encontrado en su lavadero.');
      }
      const item = itemRes.rows[0];

      // 2. Increment stock and update cost per unit & proveedor
      const updateRes = await client.query(
        `UPDATE public.stock_items 
         SET stock_actual = stock_actual + $1,
             costo_unitario = $2,
             proveedor = COALESCE($3, proveedor)
         WHERE id = $4 AND business_id = $5
         RETURNING *`,
        [cantidad, costoUnitario, proveedor, itemId, a.business.id]
      );

      // 3. Construct movement motivo
      const detallePago = medioPago === 'pendiente' ? '[A CRÉDITO - PAGO PENDIENTE]' : `[Pagado: ${medioPago}]`;
      const motivoFinal = `Compra: ${cantidad} ${item.unidad} ${detallePago} ${notas ? `- ${notas}` : ''}`.trim();

      // 4. Log stock movement with idempotency_key and proveedor
      const movementRes = await client.query(
        `INSERT INTO public.stock_movements (business_id, item_id, tipo, cantidad, unidad, costo_total, motivo, proveedor, idempotency_key)
         VALUES ($1, $2, 'compra', $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [a.business.id, itemId, cantidad, item.unidad, costoTotal, motivoFinal, proveedor, idempotencyKey]
      );

      // 5. Record expense in public.expenses ONLY if paid (not pending) and costoTotal > 0
      let expenseRecord = null;
      if (medioPago !== 'pendiente' && costoTotal > 0) {
        const expConcepto = `Compra insumo: ${item.nombre} (${cantidad} ${item.unidad})${proveedor ? ` - Prov: ${proveedor}` : ''}`;
        const expRes = await client.query(
          `INSERT INTO public.expenses (business_id, concepto, monto, categoria, fecha, medio_pago, tipo)
           VALUES ($1, $2, $3, 'insumos', CURRENT_DATE, $4, 'gasto')
           RETURNING *`,
          [a.business.id, expConcepto, costoTotal, medioPago]
        );
        expenseRecord = expRes.rows[0];
      }

      return {
        item: updateRes.rows[0],
        movement: movementRes.rows[0],
        expense: expenseRecord,
      };
    });

    return NextResponse.json({
      success: true,
      item: result.item,
      movement: result.movement,
      expense: result.expense,
      costoTotal,
      medioPago,
    });
  } catch (e: unknown) {
    // If PostgreSQL unique constraint 23505 hits on idempotency_key
    const pgErr = e as { code?: string };
    if (pgErr?.code === '23505') {
      return NextResponse.json({
        success: true,
        idempotent: true,
        message: 'Operación procesada previamente.',
      });
    }
    return fail(e);
  }
}
