import React from 'react';
import { History, UserCheck, Clock } from 'lucide-react';
import type { AuditLogEntry } from '../types/incident';

interface AuditPanelProps {
  auditLogs?: AuditLogEntry[];
  loading?: boolean;
  className?: string;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ auditLogs = [], loading = false, className = '' }) => {
  const logs: AuditLogEntry[] = auditLogs.length > 0 ? auditLogs : [
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      action: 'SYSTEM_NORMALIZATION',
      description: 'Telemetry events EVT-1021, EVT-1025 normalized and correlated into active cluster.',
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      action: 'PRIORITY_EVALUATION',
      description: 'Priority score recalculated: 73 → 86 following privilege change anomaly.',
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      action: 'STATE_TRANSITION',
      description: 'Incident status updated from INCIDENT_CANDIDATE to HIGH_PRIORITY.',
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      action: 'ANALYST_ACTION',
      description: 'Analyst SOC-Lead assigned for immediate investigation.',
    },
  ];

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className={`bg-[#0F1420] border border-[#1E2530] rounded-md p-4 space-y-3 font-mono ${className}`}>
      <div className="flex items-center justify-between border-b border-[#1E2530] pb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">
            SYSTEM & ANALYST AUDIT TRAIL
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">{logs.length} Audit Entries</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-12 bg-[#0B0E14] rounded-md animate-pulse border border-[#1E2530]" />
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#0B0E14] border border-[#1E2530] rounded-md hover:border-slate-700 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  {log.action}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  {formatTime(log.timestamp)}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">{log.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditPanel;
