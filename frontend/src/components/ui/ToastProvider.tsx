'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getUserFriendlyErrorMessage, type ErrorAction } from '@/lib/error-handler';

type ToastKind = 'error' | 'success' | 'info';

type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
};

type ShowErrorOptions = {
  action?: ErrorAction;
};

type ToastContextValue = {
  showError: (err: unknown, opts?: ShowErrorOptions) => void;
  showMessage: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function genId() {
  return Math.random().toString(36).slice(2);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showMessage = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = genId();
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => remove(id), 4500);
  }, [remove]);

  const showError = useCallback(
    (err: unknown, opts?: ShowErrorOptions) => {
      const message = getUserFriendlyErrorMessage(err, { action: opts?.action });
      showMessage(message, 'error');
    },
    [showMessage]
  );

  const value = useMemo(() => ({ showError, showMessage }), [showError, showMessage]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'w-[340px] max-w-[calc(100vw-2rem)] rounded-lg border px-4 py-3 shadow-sm bg-white',
              t.kind === 'error' ? 'border-red-200' : t.kind === 'success' ? 'border-emerald-200' : 'border-slate-200',
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            <div className={t.kind === 'error' ? 'text-red-700' : t.kind === 'success' ? 'text-emerald-700' : 'text-slate-700'}>
              {t.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

