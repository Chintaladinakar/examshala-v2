import React from 'react';
import { cn } from '@/lib/utils';

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr 
      onClick={onClick}
      className={cn(
        "hover:bg-slate-50/60 transition-colors group",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className, align = 'left', colSpan }: { children: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center'; colSpan?: number }) {
  return (
    <td 
      colSpan={colSpan}
      className={cn(
        "py-4 px-6 text-sm",
        align === 'right' && "text-right",
        align === 'center' && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}
