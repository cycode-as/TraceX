import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  change?: string;
  colorScheme?: 'blue' | 'amber' | 'red' | 'emerald' | 'purple' | 'orange';
  loading?: boolean;
}

type ColorStyle = {
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  hoverBorder: string;
  hoverGlow: string;
  changeBg: string;
  changeBorder: string;
  changeText: string;
};

const COLOR_MAP: Record<string, ColorStyle> = {
  red: {
    iconBg:      'rgba(239, 68, 68, 0.12)',
    iconBorder:  'rgba(239, 68, 68, 0.3)',
    iconColor:   '#F87171',
    hoverBorder: 'rgba(239, 68, 68, 0.4)',
    hoverGlow:   '0 0 28px -8px rgba(239, 68, 68, 0.25)',
    changeBg:    'rgba(239, 68, 68, 0.1)',
    changeBorder:'rgba(239, 68, 68, 0.25)',
    changeText:  '#F87171',
  },
  amber: {
    iconBg:      'rgba(245, 158, 11, 0.12)',
    iconBorder:  'rgba(245, 158, 11, 0.3)',
    iconColor:   '#FCD34D',
    hoverBorder: 'rgba(245, 158, 11, 0.4)',
    hoverGlow:   '0 0 28px -8px rgba(245, 158, 11, 0.25)',
    changeBg:    'rgba(245, 158, 11, 0.1)',
    changeBorder:'rgba(245, 158, 11, 0.25)',
    changeText:  '#FCD34D',
  },
  emerald: {
    iconBg:      'rgba(16, 185, 129, 0.12)',
    iconBorder:  'rgba(16, 185, 129, 0.3)',
    iconColor:   '#34D399',
    hoverBorder: 'rgba(16, 185, 129, 0.4)',
    hoverGlow:   '0 0 28px -8px rgba(16, 185, 129, 0.2)',
    changeBg:    'rgba(16, 185, 129, 0.1)',
    changeBorder:'rgba(16, 185, 129, 0.25)',
    changeText:  '#34D399',
  },
  purple: {
    iconBg:      'rgba(139, 92, 246, 0.12)',
    iconBorder:  'rgba(139, 92, 246, 0.3)',
    iconColor:   '#A78BFA',
    hoverBorder: 'rgba(139, 92, 246, 0.4)',
    hoverGlow:   '0 0 28px -8px rgba(139, 92, 246, 0.2)',
    changeBg:    'rgba(139, 92, 246, 0.1)',
    changeBorder:'rgba(139, 92, 246, 0.25)',
    changeText:  '#A78BFA',
  },
  orange: {
    iconBg:      'rgba(245, 158, 11, 0.12)',
    iconBorder:  'rgba(245, 158, 11, 0.3)',
    iconColor:   '#F59E0B',
    hoverBorder: 'rgba(245, 158, 11, 0.45)',
    hoverGlow:   '0 0 28px -8px rgba(245, 158, 11, 0.3)',
    changeBg:    'rgba(245, 158, 11, 0.1)',
    changeBorder:'rgba(245, 158, 11, 0.3)',
    changeText:  '#F59E0B',
  },
  blue: {
    iconBg:      'rgba(59, 130, 246, 0.12)',
    iconBorder:  'rgba(59, 130, 246, 0.3)',
    iconColor:   '#60A5FA',
    hoverBorder: 'rgba(59, 130, 246, 0.4)',
    hoverGlow:   '0 0 28px -8px rgba(59, 130, 246, 0.2)',
    changeBg:    'rgba(59, 130, 246, 0.1)',
    changeBorder:'rgba(59, 130, 246, 0.25)',
    changeText:  '#60A5FA',
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
  const c = COLOR_MAP[colorScheme] ?? COLOR_MAP.blue;

  if (loading) {
    return (
      <div
        className="rounded-xl p-4 flex flex-col justify-between h-28 animate-pulse"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid rgba(30, 41, 59, 0.7)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="h-3 rounded w-20" style={{ background: 'rgba(30, 41, 59, 0.8)' }} />
          <div className="w-7 h-7 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.8)' }} />
        </div>
        <div className="space-y-1.5 mt-2">
          <div className="h-7 rounded w-14" style={{ background: 'rgba(30, 41, 59, 0.8)' }} />
          <div className="h-3 rounded w-24" style={{ background: 'rgba(30, 41, 59, 0.5)' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col justify-between transition-all duration-300 group cursor-default"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(30, 41, 59, 0.7)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = c.hoverBorder;
        el.style.boxShadow = c.hoverGlow;
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'rgba(30, 41, 59, 0.7)';
        el.style.boxShadow = '';
        el.style.transform = '';
      }}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-mono font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-muted)' }}
        >
          {title}
        </span>
        <div
          className="p-1.5 rounded-lg transition-all duration-300"
          style={{
            background: c.iconBg,
            border: `1px solid ${c.iconBorder}`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: c.iconColor }} />
        </div>
      </div>

      {/* ── Value row ── */}
      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white font-mono">
            {value}
          </span>
          {change && (
            <span
              className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border"
              style={{
                background: c.changeBg,
                border: `1px solid ${c.changeBorder}`,
                color: c.changeText,
              }}
            >
              {change}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] mt-1 font-body" style={{ color: 'var(--color-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
