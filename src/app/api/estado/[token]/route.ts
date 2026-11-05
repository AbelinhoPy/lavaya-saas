import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params?.token;
    if (!token || typeof token !== 'string' || !/^tk_[a-f0-9]{16}$/.test(token)) {
      return NextResponse.json(
        { error: 'Código de consulta no válido o inexistente.' },
        { status: 404 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: 'El servicio de consulta pública no está disponible temporalmente.' },
        { status: 503 }
      );
    }

    // Select strictly minimal public information
    const rows = await query(
      `SELECT 
         j.plate,
         j.tipo,
         j.marca,
         j.service,
         j.state,
         j.inicio_lavado,
         j.listo_en,
         j.entregado_en,
         j.created_at,
         b.name AS lavadero_nombre
       FROM public.wash_jobs j
       JOIN public.businesses b ON b.id = j.business_id
       WHERE j.token_publico = $1
       LIMIT 1`,
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No encontramos ningún vehículo asociado a este código de seguimiento.' },
        { status: 404 }
      );
    }

    const job = rows[0];

    return NextResponse.json({
      status: 'success',
      data: {
        placa: job.plate,
        tipo: job.tipo,
        marca: job.marca,
        servicio: job.service,
        estado: job.state,
        lavadero: job.lavadero_nombre,
        tiempos: {
          recibido: job.created_at,
          inicioLavado: job.inicio_lavado,
          listo: job.listo_en,
          entregado: job.entregado_en,
        },
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Error al consultar el estado del vehículo.' },
      { status: 500 }
    );
  }
}
