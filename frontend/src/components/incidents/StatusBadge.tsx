import React from 'react';
import { AlertCircle, AlertTriangle, Shield, CheckCircle2, XCircle } from 'lucide-react';
import type { IncidentStatus } from '../../types/incident';

interface StatusBadgeProps {
  status: IncidentStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]';
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  switch (status) {
    case 'HIGH_PRIORITY':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-semibold font-mono bg-red-500/10 text-red-400 border border-red-500/30 ${sizeClasses} ${className}`}
        >
          {showIcon && <AlertCircle className={`${iconSize} shrink-0`} />}
          HIGH PRIORITY
        </span>
      );
    case 'INCIDENT_CANDIDATE':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
        >
          {showIcon && <AlertTriangle className={`${iconSize} shrink-0`} />}
          CANDIDATE
        </span>
      );
    case 'CONFIRMED':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-semibold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 ${sizeClasses} ${className}`}
        >
          {showIcon && <Shield className={`${iconSize} shrink-0`} />}
          CONFIRMED
        </span>
      );
    case 'RESOLVED':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-semibold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses} ${className}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSize} shrink-0`} />}
          RESOLVED
        </span>
      );
    case 'DISMISSED':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-semibold font-mono bg-slate-500/10 text-slate-400 border border-slate-500/30 ${sizeClasses} ${className}`}
        >
          {showIcon && <XCircle className={`${iconSize} shrink-0`} />}
          DISMISSED
        </span>
      );
  }
};

export default StatusBadge;
