import 'server-only';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from './db';
import { auth } from './auth';

export interface AuthenticatedAccount {
  user: {
    id: string;
    email: string;
    name: string;
  };
  business: {
    id: string;
    name: string;
    owner_id: string;
  };
  role: 'owner' | 'operator';
}

export function authConfigured(): boolean {
  return isDbConfigured();
}

export function originCheck(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return;

  const host = req.headers.get('host');
  const allowed = [
    host ? `https://${host}` : null,
    host ? `http://${host}` : null,
    process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : null,
    'https://lavaya-orcin.vercel.app',
    'https://lavaya-toman13.vercel.app',
    'http://localhost:3100',
    'http://localhost:3000',
  ].filter(Boolean);

  const isVercelSubdomain = /^https:\/\/lavaya[a-z0-9-]*\.vercel\.app$/.test(origin);

  if (!allowed.includes(origin) && !isVercelSubdomain) {
    throw new Error('Origen no permitido.');
  }
}

export async function account(): Promise<AuthenticatedAccount> {
  if (!authConfigured()) {
    throw new Error('Servicio de cuentas todavía no configurado. Podés explorar la demo sin registrarte.');
  }

  const reqHeaders = headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    throw new Error('Iniciá sesión para continuar.');
  }

  // Derive business_id strictly from authenticated session
  const businessRows = await query(
    'SELECT id, name, owner_id FROM public.businesses WHERE owner_id = $1 LIMIT 1',
    [session.user.id]
  );

  let business = businessRows[0];

  if (!business) {
    // If business doesn't exist yet, create it
    const businessName = session.user.name ? `${session.user.name}'s Lavadero` : 'Mi Lavadero';
    const created = await query(
      'INSERT INTO public.businesses (owner_id, name) VALUES ($1, $2) RETURNING id, name, owner_id',
      [session.user.id, businessName]
    );
    business = created[0];

    // Seed initial services for this business
    await query('SELECT public.seed_default_services($1)', [business.id]);

    // Add owner membership
    await query(
      'INSERT INTO public.business_members (business_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [business.id, session.user.id, 'owner']
    );
  }

  // Check role
  const memberRows = await query(
    'SELECT role FROM public.business_members WHERE business_id = $1 AND user_id = $2 LIMIT 1',
    [business.id, session.user.id]
  );
  const role = (memberRows[0]?.role as 'owner' | 'operator') || 'owner';

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    business,
    role,
  };
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'No pudimos completar la operación.';
  const safePrefixes = [
    'Servicio de cuentas',
    'Servicio interno',
    'Servicio de base de datos',
    'Origen no permitido',
    'Iniciá sesión',
    'No pudimos cargar',
    'Pagos todavía',
    'Configuración de precio',
    'Ya tenés',
    'Completá',
    'Esperá',
    'Tu suscripción',
    'Datos inválidos',
    'No pudimos verificar',
    'Transición de estado',
    'El vehículo no existe',
  ];
  const isSafe = safePrefixes.some((x) => message.startsWith(x));
  return NextResponse.json(
    { error: isSafe ? message : 'No pudimos completar la operación. Intentá de nuevo.' },
    { status }
  );
}

export async function boundedJSON(req: NextRequest) {
  const body = await req.text();
  if (body.length > 25000) throw new Error('Datos inválidos.');
  return JSON.parse(body);
}
