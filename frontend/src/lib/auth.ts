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
  switch (role) {
    case 'student':
      return '/studentdashboard';
    case 'tutor':
      return '/tutordashboard';
    case 'principal':
      return '/principaldashboard';
    case 'parent':
      return '/parentdashboard';
    default:
      return '/';
  }
}
