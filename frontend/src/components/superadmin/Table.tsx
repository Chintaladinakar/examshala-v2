import React from 'react';
import { cn } from '@/lib/utils';

interface TableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}

export function Table({ headers, children, className }: TableProps) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className={cn(
                    "py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest",
                    index === headers.length - 1 ? "text-right" : "text-left"
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
