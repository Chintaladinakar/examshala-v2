/**
 * Decodes a JWT payload without verifying the signature.
 * Suitable for edge runtimes like Next.js middleware where crypto modules are restricted.
 */
export function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(payloadBase64);
    return JSON.parse(decodeURIComponent(escape(payloadJson)));
  } catch (error) {
    return null;
  }
}

/**
 * Normalizes roles to string dashboard paths.
 */
export function getDashboardPathForRole(role: string): string {
  if (!role) return '/';
  switch (role.toLowerCase()) {
    case 'student':
      return '/studentdashboard';
    case 'tutor':
      return '/tutordashboard';
    case 'principal':
      return '/principledashboard';
    case 'teacher':
      return '/tutordashboard';
    case 'parent':
      return '/parentdashboard';
    case 'org_admin':
    case 'superadmin':
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}

/**
 * Returns all dashboard paths a given role is allowed to access.
 * Principals can access both /principledashboard (principal mode) and
 * /tutordashboard (teacher mode) for mode switching.
 * This also grants access to shared sub-routes like /students, /classes, etc.
 */
export function getAllowedDashboardPaths(role: string): string[] {
  if (!role) return ['/'];

  // Shared school routes accessible to principals and teachers
  const sharedSchoolRoutes = [
    '/students',
    '/teachers',
    '/classes',
    '/attendance',
    '/logs',
    '/tests',
    '/profile',
    '/coming-soon',
  ];

  switch (role.toLowerCase()) {
    case 'student':
      return ['/studentdashboard'];
    case 'tutor':
      return ['/tutordashboard'];
    case 'principal':
      // Principals can access both dashboards + shared routes + admin routes
      return ['/principledashboard', '/tutordashboard', '/admin', ...sharedSchoolRoutes];
    case 'teacher':
      return ['/tutordashboard', ...sharedSchoolRoutes];
    case 'parent':
      return ['/parentdashboard'];
    case 'org_admin':
    case 'superadmin':
    case 'admin':
      return ['/admin'];
    default:
      return ['/'];
  }
}
