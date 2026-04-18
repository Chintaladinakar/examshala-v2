import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload, getDashboardPathForRole } from '@/lib/auth';

const PROTECTED_ROUTES = [
  '/studentdashboard',
  '/tutordashboard',
  '/principaldashboard',
  '/parentdashboard',
  '/dashboard',
  '/superadmin'
];

const AUTH_ROUTES = ['/signin', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session_token')?.value;

  // 1. Check if the user is trying to access a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!token) {
      // Unauthenticated -> bounce to signin
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      return NextResponse.redirect(url);
    }

    const decoded = decodeJwtPayload(token);
    
    // If token is invalid or lacks role, force re-login
    if (!decoded || !decoded.role) {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      // clear invalid cookie
      const response = NextResponse.redirect(url);
      response.cookies.delete('session_token');
      return response;
    }

    // Role-based protection check
    const expectedDashboard = getDashboardPathForRole(decoded.role);
    
    // If they are a tutor trying to hit /studentdashboard, bounce them
    if (expectedDashboard !== '/' && !pathname.startsWith(expectedDashboard)) {
      const url = request.nextUrl.clone();
      url.pathname = expectedDashboard;
      return NextResponse.redirect(url);
    }
  }

  // 2. Check if logged-in user is hitting signin/signup
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (token) {
      const decoded = decodeJwtPayload(token);
      if (decoded && decoded.role) {
        const expectedDashboard = getDashboardPathForRole(decoded.role);
        const url = request.nextUrl.clone();
        url.pathname = expectedDashboard !== '/' ? expectedDashboard : '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg).*)',
  ],
};
