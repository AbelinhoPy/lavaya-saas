import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEMO_STATUS_MAP: Record<string, {
  placa: string;
  tipo: 'auto' | 'moto';
  marca: string;
  servicio: string;
  estado: 'espera' | 'lavando' | 'listo' | 'entregado';
  lavadero: string;
  tiempos: {
    recibido: string;
    inicioLavado?: string;
    listo?: string;
    entregado?: string;
  };
}> = {
  tk_demo_corolla: {
    placa: 'BCF 482',
    tipo: 'auto',
    marca: 'Toyota Corolla',
    servicio: 'Lavado Completo Auto + Encerado Carnauba Líquida',
    estado: 'lavando',
    lavadero: 'Lavadero LavaYA! (Demostración)',
    tiempos: {
      recibido: 'Hace 30 minutos',
      inicioLavado: 'Hace 15 minutos',
    },
  },
  tk_demo_kia: {
    placa: 'AAKD 793',
    tipo: 'auto',
    marca: 'Kia Sportage',
    servicio: 'Lavado Básico Exterior',
    estado: 'espera',
    lavadero: 'Lavadero LavaYA! (Demostración)',
    tiempos: {
      recibido: 'Hace 10 minutos',
    },
  },
  tk_demo_honda: {
    placa: 'BCD 165',
    tipo: 'moto',
    marca: 'Honda CB 190',
    servicio: 'Lavado Completo Moto + Silicona y Perfume',
    estado: 'listo',
    lavadero: 'Lavadero LavaYA! (Demostración)',
    tiempos: {
      recibido: 'Hace 45 minutos',
      inicioLavado: 'Hace 30 minutos',
      listo: 'Hace 5 minutos',
    },
  },
  tk_demo_hyundai: {
    placa: 'AAL 520',
    tipo: 'auto',
    marca: 'Hyundai HB20',
    servicio: 'Lavado Completo Auto',
    estado: 'entregado',
    lavadero: 'Lavadero LavaYA! (Demostración)',
    tiempos: {
      recibido: 'Hace 3 horas',
      inicioLavado: 'Hace 2.5 horas',
      listo: 'Hace 2 horas',
      entregado: 'Hace 2 horas',
    },
  },
};

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params?.token;
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Código de consulta no válido o inexistente.' },
        { status: 404 }
      );
    }

    // 1. Handle fictional demo vehicles
    if (token.startsWith('tk_demo_')) {
      const demoData = DEMO_STATUS_MAP[token] || {
        placa: 'DEMO 123',
        tipo: 'auto',
        marca: 'Vehículo de Muestra',
        servicio: 'Lavado Completo Auto',
        estado: 'espera',
        lavadero: 'Lavadero LavaYA! (Demostración)',
        tiempos: {
          recibido: 'Recién ingresado a pista',
        },
      };

      return NextResponse.json({
        status: 'success',
        isDemo: true,
        data: demoData,
      });
    }

    // 2. Validate format for real tokens
    if (!/^tk_[a-f0-9]{16}$/.test(token)) {
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

    // 3. Query real token from database (strictly minimal public data, no financial or personal contact info)
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
      isDemo: false,
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
