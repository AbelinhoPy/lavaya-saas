import { NextRequest, NextResponse } from 'next/server';
import { account, originCheck, fail, boundedJSON } from '@/lib/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const a = await account();
    let rows = await query(
      `SELECT id, tipo_vehiculo, categoria, nombre, descripcion, icono, precio, activo, created_at
       FROM public.services
       WHERE business_id = $1
       ORDER BY categoria ASC, tipo_vehiculo ASC, precio ASC`,
      [a.business.id]
    );

    if (rows.length === 0) {
      // Seed default services if empty
      await query('SELECT public.seed_default_services($1)', [a.business.id]);
      rows = await query(
        `SELECT id, tipo_vehiculo, categoria, nombre, descripcion, icono, precio, activo, created_at
         FROM public.services
         WHERE business_id = $1
         ORDER BY categoria ASC, tipo_vehiculo ASC, precio ASC`,
        [a.business.id]
      );
    }

    return NextResponse.json({ services: rows });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    originCheck(req);
    const a = await account();

    if (a.role !== 'owner') {
      return NextResponse.json(
        { error: 'Solo el dueño del lavadero puede modificar servicios y precios.' },
        { status: 403 }
      );
    }

    const b = await boundedJSON(req);
    const { id, precio, activo } = b;

    if (!id || typeof id !== 'string') {
      throw new Error('ID de servicio inválido.');
    }

    const updates: string[] = [];
    const params: any[] = [id, a.business.id];

    if (precio !== undefined) {
      const numPrecio = Number(precio);
      if (!Number.isSafeInteger(numPrecio) || numPrecio < 0 || numPrecio > 100000000) {
        throw new Error('El precio debe ser un número entero válido en guaraníes.');
      }
      params.push(numPrecio);
      updates.push(`precio = $${params.length}`);
    }

    if (activo !== undefined) {
      const boolActivo = Boolean(activo);
      params.push(boolActivo);
      updates.push(`activo = $${params.length}`);
    }

    if (updates.length === 0) {
      throw new Error('No se especificaron cambios.');
    }

    const updated = await query(
      `UPDATE public.services
       SET ${updates.join(', ')}
       WHERE id = $1 AND business_id = $2
       RETURNING id, tipo_vehiculo, categoria, nombre, descripcion, icono, precio, activo`,
      params
    );

    if (updated.length === 0) {
      throw new Error('Servicio no encontrado.');
    }

    return NextResponse.json({ service: updated[0] });
  } catch (e) {
    return fail(e);
  }
}
