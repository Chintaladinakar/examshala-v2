'use client';

import React from 'react';
import { getUserFriendlyErrorMessage, type ErrorAction } from '@/lib/error-handler';

type Props = {
  error?: unknown;
  action?: ErrorAction;
  className?: string;
};

export default function InlineError({ error, action, className }: Props) {
  if (!error) return null;
  const message = getUserFriendlyErrorMessage(error, { action });
  if (!message) return null;

  return (
    <div className={className ?? 'bg-red-50 text-red-600 p-3 rounded mb-4 text-sm text-center'}>
      {message}
    </div>
  );
}

