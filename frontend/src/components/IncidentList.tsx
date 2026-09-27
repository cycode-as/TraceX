import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, User, Clock, ChevronRight } from 'lucide-react';
import type { Incident } from '../types/incident';
import StateBadge from './StateBadge';

interface IncidentListProps {
  incidents: Incident[];
  loading?: boolean;
  className?: string;
}

export const IncidentList: React.FC<IncidentListProps> = ({ incidents, loading = false, className = '' }) => {
  const navigate = useNavigate();

  const formatTimeWindow = (createdAt: string, updatedAt: string) => {
    try {
      const c = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const u = new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${c} — ${u}`;
    } catch {
      return createdAt;
    }
  };

  const getPriorityStyle = (score: number) => {
    if (score >= 70) return { color: '#F87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', bar: '#EF4444' };
    if (score >= 40) return { color: '#FCD34D', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', bar: '#F59E0B' };
    return { color: '#60A5FA', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', bar: '#3B82F6' };
  };

  const getPriorityPill = (score: number) => {
    const s = getPriorityStyle(score);
    return (
      <div className="flex items-center gap-2">
        <span
          className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border"
          style={{ color: s.color, background: s.bg, borderColor: s.border }}
        >
          {score}
        </span>
        <div
          className="w-12 h-1 rounded-full overflow-hidden hidden sm:block"
          style={{ background: 'rgba(30, 41, 59, 0.8)' }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, score)}%`, background: s.bar }}
          />
        </div>
      </div>
    );
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
          <ShieldAlert className="w-4 h-4" style={{ color: '#F7931A' }} />
          <h2 className="text-xs uppercase tracking-wider text-white font-semibold">
            INCIDENT CLUSTERS &amp; QUEUE
          </h2>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{
              background:  'rgba(247, 147, 26, 0.1)',
              border:      '1px solid rgba(247, 147, 26, 0.2)',
              color:       '#F7931A',
            }}
          >
            {incidents.length}
          </span>
        </div>
        <span className="text-[11px] font-mono" style={{ color: 'var(--color-muted)' }}>
          Click entry to open Incident Detail
        </span>
      </div>

      {/* ── Body ── */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-12 rounded-lg animate-pulse"
              style={{ background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(30, 41, 59, 0.6)' }}
            />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div
          className="py-12 text-center space-y-2 rounded-lg font-mono"
          style={{
            border:     '1px dashed rgba(30, 41, 59, 0.7)',
            background: 'rgba(3, 3, 4, 0.5)',
          }}
        >
          <ShieldAlert className="w-8 h-8 mx-auto" style={{ color: 'var(--color-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No active security incidents</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            {/* ── Table Header ── */}
            <thead>
              <tr
                className="font-mono text-[11px] uppercase tracking-wider"
                style={{
                  background:   'rgba(3, 3, 4, 0.6)',
                  borderBottom: '1px solid rgba(30, 41, 59, 0.7)',
                  color:        'var(--color-muted)',
                }}
              >
                <th className="py-2.5 px-3 font-semibold">INCIDENT ID</th>
                <th className="py-2.5 px-3 font-semibold">PRIMARY USER</th>
                <th className="py-2.5 px-3 font-semibold">STATE</th>
                <th className="py-2.5 px-3 font-semibold">TIME WINDOW</th>
                <th className="py-2.5 px-3 font-semibold">PRIORITY</th>
                <th className="py-2.5 px-3 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            {/* ── Table Body ── */}
            <tbody>
              {incidents.map((inc) => (
                <tr
                  key={inc.incident_id}
                  onClick={() => navigate(`/incidents/${inc.incident_id}`)}
                  className="cursor-pointer group transition-all duration-200 font-mono"
                  style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.4)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(247, 147, 26, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                  }}
                >
                  {/* Incident ID */}
                  <td className="py-3 px-3 font-bold group-hover:underline" style={{ color: '#F7931A' }}>
                    {inc.incident_id}
                  </td>
                  {/* Primary User */}
                  <td className="py-3 px-3 text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                      {inc.primary_user || inc.user_id || 'USR-007'}
                    </span>
                  </td>
                  {/* State Badge */}
                  <td className="py-3 px-3">
                    <StateBadge status={inc.status} />
                  </td>
                  {/* Time Window */}
                  <td className="py-3 px-3 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" style={{ color: 'rgba(148, 163, 184, 0.5)' }} />
                      {formatTimeWindow(inc.created_at, inc.updated_at)}
                    </span>
                  </td>
                  {/* Priority */}
                  <td className="py-3 px-3">{getPriorityPill(inc.priority)}</td>
                  {/* Action */}
                  <td className="py-3 px-3 text-right">
                    <span
                      className="inline-flex items-center gap-1 font-semibold text-[11px] transition-all duration-200 group-hover:translate-x-1"
                      style={{ color: '#F7931A' }}
                    >
                      Inspect
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IncidentList;
