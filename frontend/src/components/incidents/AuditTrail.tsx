import React, { useEffect, useState } from 'react';
import { FileText, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { getIncidentAudit } from '../../services/incidents';
import type { AuditLogEntry } from '../../types/incident';

interface AuditTrailProps {
  incidentId?: string;
  entries?: AuditLogEntry[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  incidentId,
  entries: propEntries,
  title = 'Audit Trail Log',
  loading: propLoading,
  error: propError,
  onRefresh,
}) => {
  const [fetchedLogs, setFetchedLogs] = useState<AuditLogEntry[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(!propEntries && !!incidentId);
  const [internalError, setInternalError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    if (!incidentId) return;
    setInternalLoading(true);
    setInternalError(null);
    try {
      const res = await getIncidentAudit(incidentId);
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to load audit logs');
      }
      setFetchedLogs(res.data || []);
    } catch (err: unknown) {
      setInternalError(err instanceof Error ? err.message : 'Error fetching audit logs');
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (propEntries || !incidentId) return;
    let isMounted = true;

    async function init() {
      try {
        const res = await getIncidentAudit(incidentId!);
        if (!isMounted) return;
        if (!res.success) {
          throw new Error(res.error?.message || 'Failed to load audit logs');
        }
        setFetchedLogs(res.data || []);
      } catch (err: unknown) {
        if (isMounted) {
          setInternalError(err instanceof Error ? err.message : 'Error fetching audit logs');
        }
      } finally {
        if (isMounted) {
          setInternalLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [incidentId, propEntries]);

  const auditLogs = propEntries ?? fetchedLogs;
  const isLoading = propLoading ?? internalLoading;
  const displayError = propError ?? internalError;

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchAuditLogs();
    }
  };

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

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('CREATED'))
      return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: '#60A5FA' };
    if (action.includes('UPDATED'))
      return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#FCD34D' };
    if (action.includes('STATUS'))
      return { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', color: '#A78BFA' };
    return { bg: 'rgba(30,41,59,0.5)', border: 'rgba(30,41,59,0.8)', color: '#94A3B8' };
  };

  if (isLoading) {
    return (
      <div
        className="rounded-xl p-4 space-y-2.5 animate-pulse"
        style={{ background: 'var(--color-surface)', border: '1px solid rgba(30, 41, 59, 0.8)' }}
      >
        <div className="h-4 w-32 rounded" style={{ background: 'rgba(30, 41, 59, 0.6)' }} />
        <div className="space-y-1.5">
          <div className="h-9 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.3)' }} />
          <div className="h-9 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.3)' }} />
        </div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div
        className="rounded-xl p-3 flex items-center justify-between text-xs font-mono"
        style={{
          background:  'rgba(239, 68, 68, 0.06)',
          border:      '1px solid rgba(239, 68, 68, 0.25)',
          color:       '#F87171',
        }}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Audit trail failed: {displayError}</span>
        </div>
        <button
          onClick={handleRefreshClick}
          className="px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all duration-200"
          style={{
            background:  'rgba(239, 68, 68, 0.1)',
            border:      '1px solid rgba(239, 68, 68, 0.3)',
            color:       '#F87171',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
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
          <FileText className="w-4 h-4" style={{ color: '#F7931A' }} />
          <h2 className="text-xs uppercase tracking-wider text-white font-semibold">{title}</h2>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-md"
            style={{
              background:  'rgba(247, 147, 26, 0.1)',
              border:      '1px solid rgba(247, 147, 26, 0.2)',
              color:       '#F7931A',
            }}
          >
            {auditLogs.length} Entries
          </span>
        </div>
        <button
          onClick={handleRefreshClick}
          className="text-xs font-mono flex items-center gap-1 cursor-pointer transition-all duration-200"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#F7931A';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)';
          }}
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* ── Log Entries ── */}
      {auditLogs.length === 0 ? (
        <div
          className="p-4 text-center text-xs font-mono rounded-lg"
          style={{
            border:      '1px dashed rgba(30, 41, 59, 0.7)',
            background:  'rgba(3, 3, 4, 0.5)',
            color:       'var(--color-muted)',
          }}
        >
          No audit log entries recorded.
        </div>
      ) : (
        <div
          className="rounded-lg p-2.5 font-mono text-xs space-y-2 max-h-[440px] overflow-y-auto"
          style={{
            background: 'rgba(3, 3, 4, 0.6)',
            border:     '1px solid rgba(30, 41, 59, 0.7)',
          }}
        >
          {auditLogs.map((log, idx) => {
            const badgeStyle = getActionBadgeStyle(log.action);
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 p-2 rounded-lg transition-all duration-200"
                style={{
                  background:  'rgba(15, 17, 21, 0.7)',
                  border:      '1px solid rgba(30, 41, 59, 0.6)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(247, 147, 26, 0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(30, 41, 59, 0.6)';
                }}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[11px] flex items-center gap-1"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      <Clock className="w-3 h-3" style={{ color: 'rgba(148, 163, 184, 0.4)' }} />
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-bold border"
                      style={{
                        background:  badgeStyle.bg,
                        borderColor: badgeStyle.border,
                        color:       badgeStyle.color,
                      }}
                    >
                      {log.action}
                    </span>
                  </div>
                  <p className="text-xs font-sans leading-normal" style={{ color: '#CBD5E1' }}>
                    {log.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
