import { NextResponse, type NextRequest } from 'next/server';
import { buildCsp } from '@/lib/security/csp';
import { sessionCookieName } from '@/lib/auth/cookie';
import { isPublicPath } from '@/lib/auth/public-paths';

// Comprobación optimista: solo mira si existe la cookie. La validación real está en requireUser.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce, {
    dev: process.env.NODE_ENV === 'development',
    https: request.nextUrl.protocol === 'https:',
  });
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(sessionCookieName());

  let response: NextResponse;
  if (!isPublicPath(pathname) && !hasSession) {
    response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'no_autenticado' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
  } else {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', csp);
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [{ source: '/((?!_next/static|_next/image|favicon.ico).*)' }],
};
