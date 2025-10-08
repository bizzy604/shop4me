import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isStackServerConfigured, stackServerApp } from '@/lib/stack';

const protectedRoutes = ['/orders', '/checkout', '/checkout/confirmation', '/admin'];

export async function middleware(request: NextRequest) {
  // Skip middleware during build/prerender or if Stack Auth env vars are not set
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    !isStackServerConfigured
  ) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const matchedProtectedRoute = protectedRoutes.find((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!matchedProtectedRoute) {
    return NextResponse.next();
  }

  try {
    const user = await stackServerApp.getUser({
      or: 'return-null',
      tokenStore: request,
    });

    if (!user) {
      const signInUrl = new URL('/auth/signin', request.url);
      const redirectTarget = `${pathname}${request.nextUrl.search}`;
      signInUrl.searchParams.set('redirect', redirectTarget);
      return NextResponse.redirect(signInUrl);
    }

    // User sync will happen in the server action (checkout, orders page, etc.)
    // since Prisma cannot run in Edge Runtime (middleware environment)
  } catch (error) {
    console.error('Auth middleware error:', error);
    const signInUrl = new URL('/auth/signin', request.url);
    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set('redirect', redirectTarget);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
