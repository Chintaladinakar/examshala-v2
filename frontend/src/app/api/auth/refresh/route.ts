import { jsonOk, jsonError } from '@/lib/school/http';
import { tryRefreshAccessToken } from '@/lib/auth-session';

// Client-triggerable silent refresh (e.g. called proactively before an access token expires).
// The same rotation logic also runs transparently inside the backend proxy on a 401 — this
// route exists for callers that want to refresh ahead of time rather than reactively.
export async function POST() {
  const token = await tryRefreshAccessToken();
  if (!token) {
    return jsonError('INVALID_REFRESH_TOKEN', 'Session expired. Please sign in again.', 401);
  }
  return jsonOk({ success: true });
}
