import { NextRequest, NextResponse } from 'next/server';
import { account, originCheck, fail, boundedJSON } from '@/lib/server';
import { query } from '@/lib/db';

const SUGGESTED_ITEMS = [
  { nombre: 'Champú Ph Neutro', categoria: 'quimico', unidad: 'L', stock_minimo: 5 },
  { nombre: 'Cera Líquida Carnauba', categoria: 'quimico', unidad: 'L', stock_minimo: 3 },
  { nombre: 'Desengrasante Motor/Chasis', categoria: 'quimico', unidad: 'L', stock_minimo: 4 },
  { nombre: 'Silicona Abrillantadora Cubiertas', categoria: 'quimico', unidad: 'L', stock_minimo: 2 },
  { nombre: 'Paños Microfibra 40x40', categoria: 'accesorio', unidad: 'unidades', stock_minimo: 10 },
];

export async function GET(req: NextRequest) {
  try {
    originCheck(req);
    const a = await account();

    // Strictly read-only: NEVER seed mock stock or fake quantities on GET
    const rawItems = await query(
      `SELECT * FROM public.stock_items 
       WHERE business_id = $1 
         AND (is_active IS NULL OR is_active = true)
       ORDER BY nombre ASC`,
      [a.business.id]
    );

    // Get recent movements (up to 20)
    const rawMovements = await query(
      `SELECT m.*, i.nombre as item_nombre 
       FROM public.stock_movements m
       JOIN public.stock_items i ON i.id = m.item_id
       WHERE m.business_id = $1
       ORDER BY m.created_at DESC
       LIMIT 20`,
      [a.business.id]
    );

    const isOperator = a.role === 'operator';

    // Hide costs from operators to protect business finances
    const items = rawItems.map((it: Record<string, unknown>) => ({
      ...it,
      costo_unitario: isOperator ? 0 : Number(it.costo_unitario || 0),
    }));

    const movements = rawMovements.map((m: Record<string, unknown>) => ({
      ...m,
      costo_total: isOperator ? 0 : Number(m.costo_total || 0),
    }));

    return NextResponse.json({
      items,
      movements,
      isOwner: a.role === 'owner',
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
        { error: 'Acceso reservado para el dueño del lavadero.' },
        { status: 403 }
      );
    }

    const b = await boundedJSON(req);
    const action = b.action;

    // Explicit user action to load suggested template with 0 stock
    if (action === 'cargar_catalogo_sugerido') {
      const existing = await query(
        `SELECT nombre FROM public.stock_items WHERE business_id = $1`,
        [a.business.id]
      );
      const existingNames = new Set(existing.map((r: { nombre: string }) => r.nombre.toLowerCase()));

      let insertedCount = 0;
      for (const item of SUGGESTED_ITEMS) {
        if (!existingNames.has(item.nombre.toLowerCase())) {
          await query(
            `INSERT INTO public.stock_items (business_id, nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario, is_active)
             VALUES ($1, $2, $3, $4, 0, $5, 0, true)`,
            [a.business.id, item.nombre, item.categoria, item.unidad, item.stock_minimo]
          );
          insertedCount++;
        }
      }

      const updatedItems = await query(
        `SELECT * FROM public.stock_items 
         WHERE business_id = $1 AND (is_active IS NULL OR is_active = true)
         ORDER BY nombre ASC`,
        [a.business.id]
      );

      return NextResponse.json({
        success: true,
        message: `Catálogo sugerido cargado (${insertedCount} insumos con stock inicial en 0).`,
        items: updatedItems,
      });
    }

    if (action === 'desactivar' || action === 'eliminar') {
      const id = String(b.id || '');
      if (!id) throw new Error('ID de insumo no especificado.');

      await query(
        `UPDATE public.stock_items SET is_active = false WHERE id = $1 AND business_id = $2`,
        [id, a.business.id]
      );

      return NextResponse.json({ success: true, message: 'Insumo archivado.' });
    }

    if (action === 'ajuste') {
      const id = String(b.id);
      const nuevoStock = Number(b.nuevo_stock);
      const motivo = typeof b.motivo === 'string' ? b.motivo.slice(0, 150) : 'Ajuste manual de inventario';

      if (isNaN(nuevoStock) || nuevoStock < 0) {
        throw new Error('El stock no puede ser negativo.');
      }

      const itemRows = await query(
        `SELECT * FROM public.stock_items WHERE id = $1 AND business_id = $2`,
        [id, a.business.id]
      );
      if (itemRows.length === 0) throw new Error('Insumo no encontrado.');
      const item = itemRows[0];

      const diff = nuevoStock - Number(item.stock_actual);

      const updated = await query(
        `UPDATE public.stock_items 
         SET stock_actual = $1 
         WHERE id = $2 AND business_id = $3 
         RETURNING *`,
        [nuevoStock, id, a.business.id]
      );

      await query(
        `INSERT INTO public.stock_movements (business_id, item_id, tipo, cantidad, unidad, costo_total, motivo)
         VALUES ($1, $2, 'ajuste', $3, $4, 0, $5)`,
        [a.business.id, id, Math.abs(diff), item.unidad, `${motivo} (cambio: ${diff > 0 ? '+' : ''}${diff})`]
      );

      return NextResponse.json({ item: updated[0] });
    }

    // Create new item
    const nombre = typeof b.nombre === 'string' ? b.nombre.trim() : '';
    const categoria = typeof b.categoria === 'string' ? b.categoria.trim() : 'quimico';
    const unidad = ['L', 'ml', 'unidades', 'kg', 'g'].includes(b.unidad) ? b.unidad : 'L';
    const stockActual = Math.max(0, Number(b.stock_actual) || 0);
    const stockMinimo = Math.max(0, Number(b.stock_minimo) || 0);
    const costoUnitario = Math.max(0, Number(b.costo_unitario) || 0);
    const proveedor = typeof b.proveedor === 'string' ? b.proveedor.trim().slice(0, 100) : null;

    if (nombre.length < 2 || nombre.length > 100) {
      throw new Error('El nombre del insumo debe tener entre 2 y 100 caracteres.');
    }

    const inserted = await query(
      `INSERT INTO public.stock_items (business_id, nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario, proveedor, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [a.business.id, nombre, categoria, unidad, stockActual, stockMinimo, costoUnitario, proveedor]
    );

    if (stockActual > 0) {
      await query(
        `INSERT INTO public.stock_movements (business_id, item_id, tipo, cantidad, unidad, costo_total, motivo, proveedor)
         VALUES ($1, $2, 'ajuste', $3, $4, $5, 'Inventario inicial al crear insumo', $6)`,
        [a.business.id, inserted[0].id, stockActual, unidad, stockActual * costoUnitario, proveedor]
      );
    }

    return NextResponse.json({ item: inserted[0] });
  } catch (e) {
    return fail(e);
  }
}
