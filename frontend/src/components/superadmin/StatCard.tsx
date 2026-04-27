import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600',
  rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600',
};

export function StatCard({ label, value, icon: Icon, color = 'indigo', trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {trend && (
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded-lg",
              trend.isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
            )}>
              {trend.isPositive ? '+' : '-'}{trend.value}
            </span>
          )}
        </div>
      </div>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:rotate-6 group-hover:scale-110",
        colorMap[color]
      )}>
        <Icon className="w-7 h-7 group-hover:text-white transition-colors" />
      </div>
    </div>
  );
}
