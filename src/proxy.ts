import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

// Cała aplikacja wymaga logowania. Publiczne: strony logowania/rejestracji, /api/auth/*
// oraz pobieranie oferty PDF/Word przez klienta (te trasy same sprawdzają token albo sesję).
// To tylko wstępny filtr - handlery dodatkowo sprawdzają sesję.
const AUTH_PAGES = ['/login', '/register'];
const PUBLIC_API = [/^\/api\/auth\//, /^\/api\/quotes\/[^/]+\/(pdf|word)$/];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (AUTH_PAGES.includes(pathname)) {
    return session ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next();
  }
  if (session || PUBLIC_API.some((re) => re.test(pathname))) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }
  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$).*)'],
};
