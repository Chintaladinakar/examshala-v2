import React from 'react';
import { getUserFriendlyErrorMessage, type ErrorAction } from '@/lib/error-handler';

type Props = {
  error: unknown;
  action?: ErrorAction;
  title?: string;
  onRetryHref?: string;
};

export default function FullPageErrorState({ error, action, title, onRetryHref }: Props) {
  const message = getUserFriendlyErrorMessage(error, { action });

  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
      <h2 className="text-xl font-bold text-slate-700 mb-2">{title ?? 'Error'}</h2>
      <p className="text-slate-500 text-center max-w-xl">{message}</p>
      {onRetryHref ? (
        <a
          href={onRetryHref}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800"
        >
          Try again
        </a>
      ) : null}
    </div>
  );
}

