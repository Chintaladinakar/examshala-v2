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

export async function fetchJson<T = unknown>(pathOrUrl: string, options?: FetchJsonOptions): Promise<T> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE_URL}${pathOrUrl}`;
  const action = options?.action;

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new AppError('Network error', { kind: 'network', action, details: err });
  }

  const body = await safeReadJson(res);

  if (!res.ok) {
    const payload = extractBackendErrorPayload(body);
    throw new AppError('Request failed', {
      kind: 'http',
      status: res.status,
      code: payload?.code,
      action,
      details: { url, status: res.status, payload },
    });
  }

  return body as T;
}
