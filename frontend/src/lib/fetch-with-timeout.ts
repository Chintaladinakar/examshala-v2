// A hung/slow backend call inside a Next.js route handler otherwise holds that request open
// indefinitely — no timeout means the frontend's own request to the browser eventually times
// out at whatever layer sits above it (or never does), instead of failing fast with a clear
// 504-ish response. Wraps `fetch` with an AbortController on a fixed deadline.
export const BACKEND_FETCH_TIMEOUT_MS = 20_000;

export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs: number = BACKEND_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Backend request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
