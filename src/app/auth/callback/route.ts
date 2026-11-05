import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';
  const next = req.nextUrl.searchParams.get('next') === '/restablecer' ? '/restablecer' : '/panel';
  return NextResponse.redirect(new URL(next, origin));
}
