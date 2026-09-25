import React, { useEffect, useState } from 'react';
import { FileText, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { getIncidentAudit } from '../../services/incidents';
import type { AuditLogEntry } from '../../types/incident';

interface AuditTrailProps {
  incidentId: string;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ incidentId }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getIncidentAudit(incidentId);
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to load audit logs');
      }
      setAuditLogs(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await getIncidentAudit(incidentId);
        if (!isMounted) return;
        if (!res.success) {
          throw new Error(res.error?.message || 'Failed to load audit logs');
        }
        setAuditLogs(res.data || []);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error fetching audit logs');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [incidentId]);

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`;
    } catch {
      return isoString;
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (action.includes('UPDATED')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (action.includes('STATUS')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 animate-pulse">
        <div className="h-5 w-36 bg-slate-800 rounded" />
        <div className="space-y-2">
          <div className="h-10 bg-slate-800/40 rounded-lg" />
          <div className="h-10 bg-slate-800/40 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between text-xs text-red-400 font-mono">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Audit trail failed: {error}</span>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded font-medium cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-100">Audit Trail Log</h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {auditLogs.length} Entries
          </span>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* System Log Console view */}
      {auditLogs.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-lg bg-slate-950/40">
          No audit log entries recorded.
        </div>
      ) : (
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3.5 font-mono text-xs space-y-2.5 max-h-[320px] overflow-y-auto">
          {auditLogs.map((log, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-2 rounded bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/60 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                </div>
                <p className="text-slate-300 text-xs font-sans leading-normal">
                  {log.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
