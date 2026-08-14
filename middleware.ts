import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://thepathflow.online',
    'https://thepathflow.vercel.app',
    'https://app.pathflow.dev',
    'https://pathflow.dev',
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_MARKETING_URL,
  ].filter(Boolean) as string[];

  const isAllowed = origin ? (allowedOrigins.includes(origin) || origin.includes('localhost')) : false;
  const corsOrigin = isAllowed ? origin! : (process.env.NEXT_PUBLIC_MARKETING_URL || 'https://thepathflow.online');

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-PathFlow-Key',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle CORS preflight options for external API / Python SDK requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }

  // 2. Inject CORS headers on API responses
  const response = NextResponse.next();
  if (pathname.startsWith('/api/')) {
    const corsHeaders = getCorsHeaders(request);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // 3. Protected Dashboard Routes Check (Google OAuth)
  const isProtectedPath = pathname.startsWith('/runs') || 
                          pathname.startsWith('/compare') || 
                          pathname.startsWith('/settings') ||
                          pathname.startsWith('/analytics') ||
                          pathname.startsWith('/agents') ||
                          pathname.startsWith('/detections') ||
                          pathname.startsWith('/prompts') ||
                          pathname.startsWith('/experiments');

  if (isProtectedPath) {
    const sessionToken = request.cookies.get('authjs.session-token')?.value || 
                         request.cookies.get('__Secure-authjs.session-token')?.value ||
                         request.cookies.get('next-auth.session-token')?.value ||
                         request.cookies.get('__Secure-next-auth.session-token')?.value ||
                         request.cookies.get('pathflow_session')?.value;

    if (!sessionToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      const fullPath = pathname.startsWith('/app') ? pathname : `/app${pathname}`;
      loginUrl.searchParams.set('callbackUrl', fullPath);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/runs/:path*', '/compare', '/settings', '/analytics/:path*', '/agents/:path*', '/detections/:path*', '/prompts/:path*', '/experiments/:path*', '/api/:path*'],
};
