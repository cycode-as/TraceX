import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  change?: string;
  colorScheme?: 'blue' | 'amber' | 'red' | 'emerald' | 'purple';
  loading?: boolean;
}

const colorStyles = {
  blue: {
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    glow: 'group-hover:border-blue-500/30',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    glow: 'group-hover:border-amber-500/30',
  },
  red: {
    iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
    glow: 'group-hover:border-red-500/30',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    glow: 'group-hover:border-emerald-500/30',
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    glow: 'group-hover:border-purple-500/30',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  colorScheme = 'blue',
  loading = false,
}) => {
  const styles = colorStyles[colorScheme] || colorStyles.blue;

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 animate-pulse flex flex-col justify-between h-32">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-800 rounded w-24"></div>
          <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="space-y-2 mt-3">
          <div className="h-8 bg-slate-800 rounded w-16"></div>
          <div className="h-3 bg-slate-800/60 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 hover:bg-slate-900/95 transition-all duration-200 shadow-sm ${styles.glow} flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-lg border ${styles.iconBg} transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-slate-100 font-mono">{value}</span>
          {change && (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {change}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
