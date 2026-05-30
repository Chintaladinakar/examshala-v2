import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload, getDashboardPathForRole, getAllowedDashboardPaths } from '@/lib/auth';

const PROTECTED_ROUTES = [
  '/studentdashboard',
  '/tutordashboard',
  '/parentdashboard',
  '/principledashboard',
  '/superadmin',
  '/admin',
];

const AUTH_ROUTES = ['/signin', '/signup'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session_token')?.value;

  // 1. Check if the user is trying to access a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

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
      const response = NextResponse.redirect(url);
      response.cookies.delete('session_token');
      return response;
    }

    // Role-based protection:
    // Principals can access both /principledashboard and /tutordashboard (mode switching).
    // Other roles are constrained to their expected dashboard.
    const allowedPaths = getAllowedDashboardPaths(decoded.role);
    const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

    if (!isAllowed) {
      const url = request.nextUrl.clone();
      url.pathname = allowedPaths[0] || '/signin';
      return NextResponse.redirect(url);
    }
  }

  // 2. Check if logged-in user is hitting signin/signup
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const errorParam = request.nextUrl.searchParams.get('error');
    const logoutParam = request.nextUrl.searchParams.get('logout');
    if (token && !errorParam && !logoutParam) {
      const decoded = decodeJwtPayload(token);
      if (decoded && decoded.role) {
        const expectedDashboard = getDashboardPathForRole(decoded.role);
        const url = request.nextUrl.clone();
        url.pathname = expectedDashboard !== '/' ? expectedDashboard : '/principledashboard';
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
