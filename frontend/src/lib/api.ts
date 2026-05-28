import { AppError, type BackendErrorPayload, type ErrorAction } from '@/lib/error-handler';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000';

type FetchJsonOptions = RequestInit & {
  action?: ErrorAction;
};

async function safeReadJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function extractBackendErrorPayload(body: unknown): BackendErrorPayload | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as Record<string, unknown>;
  const maybe = (record.error ?? record) as unknown;
  if (maybe && typeof maybe === 'object') {
    const maybeRec = maybe as Record<string, unknown>;
    const code = typeof maybeRec.code === 'string' ? maybeRec.code : undefined;
    const message = typeof maybeRec.message === 'string' ? maybeRec.message : undefined;
    return code || message ? { code, message } : undefined;
  }
  return undefined;
}

export async function fetchJson<T = any>(
  pathOrUrl: string,
  options?: RequestInit & { action?: string }
): Promise<T> {
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : (pathOrUrl.startsWith('/api/results') || pathOrUrl === '/api/results')
      ? pathOrUrl
      : `${API_BASE_URL}${pathOrUrl}`;

  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid JSON response");
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}
