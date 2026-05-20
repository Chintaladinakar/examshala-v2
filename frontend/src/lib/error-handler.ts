export type ErrorAction =
  | 'login'
  | 'signup'
  | 'forgot_password'
  | 'reset_password'
  | 'load'
  | 'submit'
  | 'create'
  | 'update'
  | 'delete'
  | 'modal_action'
  | 'unknown';

export type BackendErrorPayload = {
  code?: string;
  message?: string;
};

export type AppErrorKind = 'network' | 'timeout' | 'http' | 'unknown';

export class AppError extends Error {
  kind: AppErrorKind;
  status?: number;
  code?: string;
  action?: ErrorAction;
  details?: unknown;

  constructor(message: string, opts?: Partial<AppError>) {
    super(message);
    this.name = 'AppError';
    this.kind = opts?.kind ?? 'unknown';
    this.status = opts?.status;
    this.code = opts?.code;
    this.action = opts?.action;
    this.details = opts?.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function looksLikeFetchNetworkError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('fetch') // conservative; we only use this when TypeError
  );
}

function looksLikeTimeoutError(err: unknown): boolean {
  if (!isRecord(err)) return false;
  const name = String(err.name || '');
  const code = String(err.code || '');
  const message = String(err.message || '').toLowerCase();
  return (
    name === 'AbortError' ||
    code === 'ECONNABORTED' ||
    message.includes('timeout') ||
    message.includes('timed out')
  );
}

function getStatusFromUnknown(err: unknown): number | undefined {
  if (!isRecord(err)) return undefined;
  const maybeStatus = (err as Record<string, unknown>).status;
  if (typeof maybeStatus === 'number') return maybeStatus;
  const response = (err as Record<string, unknown>).response;
  if (isRecord(response)) {
    const rs = response.status;
    if (typeof rs === 'number') return rs;
  }
  return undefined;
}

function getBackendCodeFromUnknown(err: unknown): string | undefined {
  if (!isRecord(err)) return undefined;
  const code = (err as Record<string, unknown>).code;
  if (typeof code === 'string') return code;
  const data = (err as Record<string, unknown>).data;
  const response = (err as Record<string, unknown>).response;
  const responseData = isRecord(response) ? response.data : undefined;
  const merged = data ?? responseData;
  if (isRecord(merged)) {
    const c = merged.code;
    if (typeof c === 'string') return c;
  }
  return undefined;
}

export type FriendlyErrorOptions = {
  action?: ErrorAction;
};

const CODE_MESSAGE_MAP: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Failed to login. Please check your credentials and try again.',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  AUTH_UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested item could not be found.',
  SERVICE_UNAVAILABLE: 'Our servers are having trouble right now. Please try again in a little while.',
};

function actionDefaultMessage(action: ErrorAction | undefined): string {
  switch (action) {
    case 'login':
      return 'Unable to login right now. Please try again after some time.';
    case 'signup':
      return "Failed to create your account. Please try again.";
    case 'forgot_password':
    case 'reset_password':
    case 'submit':
    case 'create':
    case 'update':
    case 'delete':
    case 'modal_action':
      return "We couldn’t complete your request. Please try again.";
    case 'load':
      return 'Something went wrong. Please try again later.';
    default:
      return 'Something went wrong. Please try again later.';
  }
}

function messageForHttpStatus(status: number, action?: ErrorAction): string {
  if (status === 401) {
    if (action === 'login') {
      return 'Failed to login. Please check your credentials and try again.';
    }
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested item could not be found.';
  if (status === 429) return "We couldn’t complete your request. Please try again.";
  if (status >= 500) return 'Our servers are having trouble right now. Please try again in a little while.';
  return actionDefaultMessage(action);
}

export function normalizeToAppError(err: unknown, opts?: FriendlyErrorOptions): AppError {
  if (err instanceof AppError) {
    if (opts?.action && !err.action) err.action = opts.action;
    return err;
  }

  const action = opts?.action;
  const status = getStatusFromUnknown(err);
  const backendCode = getBackendCodeFromUnknown(err);

  if (looksLikeTimeoutError(err)) {
    return new AppError('Request timed out', { kind: 'timeout', action, status, code: backendCode, details: err });
  }

  if (looksLikeFetchNetworkError(err)) {
    return new AppError('Network error', { kind: 'network', action, status, code: backendCode, details: err });
  }

  if (typeof status === 'number') {
    return new AppError(`HTTP ${status}`, { kind: 'http', status, action, code: backendCode, details: err });
  }

  if (isRecord(err) && err.isAxiosError === true) {
    // Axios may fail without a response for network errors.
    return new AppError('Network error', { kind: 'network', action, code: backendCode, details: err });
  }

  return new AppError('Unknown error', { kind: 'unknown', action, status, code: backendCode, details: err });
}

export function getUserFriendlyErrorMessage(err: unknown, opts?: FriendlyErrorOptions): string {
  const appErr = normalizeToAppError(err, opts);

  if (appErr.code && CODE_MESSAGE_MAP[appErr.code]) {
    return CODE_MESSAGE_MAP[appErr.code]!;
  }

  if (appErr.kind === 'network' || appErr.kind === 'timeout') {
    if (appErr.action === 'login') {
      return 'Unable to login right now. Please try again after some time.';
    }
    return 'Unable to connect right now. Please check your internet connection and try again.';
  }

  if (typeof appErr.status === 'number') {
    return messageForHttpStatus(appErr.status, appErr.action);
  }

  return actionDefaultMessage(appErr.action);
}

export function logDeveloperError(err: unknown, context?: Record<string, unknown>) {
  // Keep technical details out of the UI; log for developers only.
  console.error('[AppError]', context ?? {}, err);
}
