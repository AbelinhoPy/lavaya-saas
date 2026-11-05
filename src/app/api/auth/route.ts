import { NextRequest, NextResponse } from 'next/server';
import { serverDB, originCheck, fail, boundedJSON } from '@/lib/server';
export async function POST(req: NextRequest) {
 try {
  originCheck(req);
  const { mode, email: value, password, business, consent } = await boundedJSON(req);
  const db = serverDB();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';
  if (mode === 'logout') { await db.auth.signOut(); return NextResponse.json({ ok: true }); }
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Completá un correo válido.');
  if (mode === 'recover') {
   await db.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/restablecer` });
   return NextResponse.json({ message: 'Si el correo está registrado, recibirás un enlace para cambiar la contraseña.' });
  }
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) throw new Error('Completá una contraseña de entre 10 y 128 caracteres.');
  if (mode === 'register') {
   if (consent !== true) throw new Error('Completá la aceptación de las condiciones para crear la cuenta.');
   if (typeof business !== 'string' || business.trim().length < 2 || business.length > 100) throw new Error('Completá el nombre del lavadero (2–100 caracteres).');
   const { error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/auth/callback`, data: { business_name: business.trim() } } });
   if (error) return NextResponse.json({ error: 'No pudimos crear la cuenta. Revisá los datos o intentá ingresar si ya tenés una.' }, { status: 400 });
   return NextResponse.json({ message: 'Revisá tu correo para confirmar la cuenta. La prueba todavía no empezó y no se solicitó tu tarjeta.' });
  }
  if (mode === 'reset') {
   const { data: { user } } = await db.auth.getUser();
   if (!user) throw new Error('Iniciá sesión desde el enlace de recuperación.');
   const { error } = await db.auth.updateUser({ password });
   if (error) throw new Error('No pudimos completar la operación.');
   return NextResponse.json({ message: 'Contraseña actualizada. Ya podés abrir tu panel.', redirect: '/panel' });
  }
  if (mode !== 'login') throw new Error('Datos inválidos.');
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ error: 'Correo o contraseña incorrectos, o correo aún sin confirmar.' }, { status: 401 });
  return NextResponse.json({ redirect: '/panel' });
 } catch (e) { return fail(e); }
}
