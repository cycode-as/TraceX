import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Clock, User, HardDrive, AlertTriangle } from 'lucide-react';
import type { NormalizedEvent } from '../types/event';

interface TelemetryFeedProps {
  events: NormalizedEvent[];
  loading?: boolean;
  className?: string;
}

export const TelemetryFeed: React.FC<TelemetryFeedProps> = ({ events, loading = false, className = '' }) => {
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getPriorityTag = (eventType: string, metadata?: Record<string, unknown>) => {
    if (['large_transfer', 'privilege_change', 'admin_action', 'mfa_failure'].includes(eventType) || metadata?.anomaly) {
      return {
        label: 'HIGH',
        bg:    'rgba(239, 68, 68, 0.12)',
        border:'rgba(239, 68, 68, 0.35)',
        color: '#F87171',
      };
    }
    if (['new_device', 'new_location', 'resource_access'].includes(eventType)) {
      return {
        label: 'MED',
        bg:    'rgba(245, 158, 11, 0.12)',
        border:'rgba(245, 158, 11, 0.3)',
        color: '#FCD34D',
      };
    }
    return {
      label: 'INFO',
      bg:    'rgba(30, 41, 59, 0.4)',
      border:'rgba(30, 41, 59, 0.7)',
      color: 'var(--color-muted)',
    };
  };

  const formatExtraDetails = (evt: NormalizedEvent) => {
    if (evt.metadata?.bytes_transferred) return `${evt.metadata.bytes_transferred}`;
    if (evt.metadata?.file_size)          return `${evt.metadata.file_size}`;
    if (evt.resource)                     return evt.resource;
    if (evt.ip_address)                   return evt.ip_address;
    return evt.location || 'system';
  };

  return (
    <div
      className={`rounded-xl p-4 space-y-3 ${className}`}
      style={{
        background: 'var(--color-surface)',
        border:     '1px solid rgba(30, 41, 59, 0.8)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between pb-2.5"
        style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.7)' }}
      >
        <div className="flex items-center gap-2 font-mono">
          <Terminal className="w-4 h-4" style={{ color: '#10B981' }} />
          <h2 className="text-xs uppercase tracking-wider font-semibold text-white">
            LIVE TELEMETRY STREAM
          </h2>
          {/* Live ping dot */}
          <span className="flex h-2 w-2 relative">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: '#10B981' }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: '#10B981' }}
            />
          </span>
        </div>
        <span className="text-[11px] font-mono" style={{ color: 'var(--color-muted)' }}>
          Auto-refresh stream
        </span>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-11 rounded-lg animate-pulse"
              style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(30, 41, 59, 0.6)' }}
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div
          className="py-10 text-center space-y-2 rounded-lg font-mono"
          style={{
            border:      '1px dashed rgba(30, 41, 59, 0.7)',
            background:  'rgba(3, 3, 4, 0.5)',
          }}
        >
          <AlertTriangle className="w-8 h-8 mx-auto" style={{ color: 'var(--color-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No telemetry events recorded</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {events.slice(0, 15).map((evt) => {
              const tag = getPriorityTag(evt.event_type, evt.metadata);
              const detail = formatExtraDetails(evt);

              return (
                <motion.div
                  key={evt.event_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-2.5 rounded-lg font-mono text-xs flex items-center justify-between gap-2 transition-all duration-200"
                  style={{
                    background: 'rgba(3, 3, 4, 0.6)',
                    border:     '1px solid rgba(30, 41, 59, 0.6)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(247, 147, 26, 0.2)';
                    (e.currentTarget as HTMLDivElement).style.background   = 'rgba(247, 147, 26, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(30, 41, 59, 0.6)';
                    (e.currentTarget as HTMLDivElement).style.background   = 'rgba(3, 3, 4, 0.6)';
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="text-[11px] flex items-center gap-1 shrink-0"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      <Clock className="w-3 h-3" style={{ color: 'rgba(148, 163, 184, 0.5)' }} />
                      {formatTime(evt.timestamp)}
                    </span>
                    <span className="text-slate-200 font-semibold truncate">{evt.event_type}</span>
                    <span style={{ color: 'rgba(30, 41, 59, 0.8)' }}>·</span>
                    <span
                      className="flex items-center gap-1 shrink-0"
                      style={{ color: '#F7931A' }}
                    >
                      <User className="w-3 h-3" style={{ color: 'rgba(148, 163, 184, 0.5)' }} />
                      {evt.user_id || 'SYSTEM'}
                    </span>
                    <span style={{ color: 'rgba(30, 41, 59, 0.8)' }}>·</span>
                    <span
                      className="text-[11px] truncate max-w-[130px] flex items-center gap-1"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      <HardDrive className="w-3 h-3" style={{ color: 'rgba(148, 163, 184, 0.4)' }} />
                      {detail}
                    </span>
                  </div>

                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0"
                    style={{ background: tag.bg, borderColor: tag.border, color: tag.color }}
                  >
                    {tag.label}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TelemetryFeed;
