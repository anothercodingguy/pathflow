import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle CORS preflight options for external Python SDK requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-PathFlow-Key',
      },
    });
  }

  // 2. Inject CORS headers on API responses
  const response = NextResponse.next();
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-PathFlow-Key');
    return response;
  }

  // 3. Protected Dashboard Routes Check (Google OAuth)
  const isProtectedPath = pathname.startsWith('/runs') || 
                          pathname.startsWith('/compare') || 
                          pathname.startsWith('/settings');

  if (isProtectedPath) {
    const sessionToken = request.cookies.get('authjs.session-token')?.value || 
                         request.cookies.get('__Secure-authjs.session-token')?.value ||
                         request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value ||
                         request.cookies.get('pathflow_session')?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/runs/:path*', '/compare', '/settings', '/api/:path*'],
};
