import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /panel routes: ensure session cookie exists
  if (pathname.startsWith('/panel')) {
    const sessionCookie =
      req.cookies.get('better-auth.session_token') ||
      req.cookies.get('__Secure-better-auth.session_token');

    // If database is not configured or session cookie is completely missing, redirect to ingresar
    if (!sessionCookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/ingresar';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/panel/:path*'],
};
