import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export function authConfigured() { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); }
export function serverDB() {
 if (!authConfigured()) throw new Error('Servicio de cuentas todavía no configurado. Podés explorar la demo sin registrarte.');
 const jar = cookies();
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  cookies: { getAll: () => jar.getAll(), setAll: (values: {name: string; value: string; options: CookieOptions}[]) => values.forEach(({ name, value, options }) => jar.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' })) }
 });
}
export function adminDB() {
 if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Servicio interno no configurado.');
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function originCheck(req: NextRequest) {
 const origin = req.headers.get('origin');
 const expected = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';
 if (!origin || origin !== new URL(expected).origin) throw new Error('Origen no permitido.');
}
export async function account() {
 const db = serverDB();
 const { data: { user }, error } = await db.auth.getUser();
 if (error || !user) throw new Error('Iniciá sesión para continuar.');
 const { data: business, error: businessError } = await db.from('businesses').select('id,name,owner_id').eq('owner_id', user.id).single();
 if (businessError || !business) throw new Error('No pudimos cargar tu negocio.');
 return { db, user, business };
}
export function fail(error: unknown, status = 400) {
 const message = error instanceof Error ? error.message : 'No pudimos completar la operación.';
 const safe = ['Servicio de cuentas','Servicio interno','Origen no permitido','Iniciá sesión','No pudimos cargar','Pagos todavía','Configuración de precio','Ya tenés','Completá','Esperá','Tu suscripción','Datos inválidos','No pudimos verificar'].some(x => message.startsWith(x));
 return NextResponse.json({ error: safe ? message : 'No pudimos completar la operación. Intentá de nuevo.' }, { status });
}
export async function boundedJSON(req: NextRequest) {
 const body = await req.text();
 if (body.length > 12000) throw new Error('Datos inválidos.');
 return JSON.parse(body);
}
