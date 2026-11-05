import { NextRequest, NextResponse } from 'next/server';
import { serverDB } from '@/lib/server';
export async function GET(req: NextRequest) {
 const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';
 const code = req.nextUrl.searchParams.get('code');
 const next = req.nextUrl.searchParams.get('next') === '/restablecer' ? '/restablecer' : '/panel';
 try { if (code) { const { error } = await serverDB().auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(new URL(next, origin)); } } catch {}
 return NextResponse.redirect(new URL('/ingresar?error=confirmacion', origin));
}
