import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

// Ochrona panelu admina i jego API. Logowanie (/panel/login, /api/admin/login) przepuszczane.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/panel/login' || pathname === '/api/admin/login') return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }
  const loginUrl = new URL('/panel/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/panel/:path*', '/api/admin/:path*'],
};
