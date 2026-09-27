import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  AlertCircle,
  X,
  FileText,
  Clock,
  UserCheck,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Filter,
  User,
  Cpu,
  Terminal,
} from 'lucide-react';
import { getAuditLog } from '../services/audit';
import type { AuditLogEntry } from '../types/incident';

type AuditFilterCategory = 'ALL' | 'ANALYST' | 'STATE' | 'PIPELINE';

export const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<AuditFilterCategory>('ALL');

  const fetchAuditData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditLog();
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to fetch system audit logs');
      }
      setLogs(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await getAuditLog();
        if (!isMounted) return;
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'Failed to fetch system audit logs');
        }
        setLogs(res.data);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error loading audit logs');
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
  }, []);

  // Categorize an audit log entry
  const getCategory = (log: AuditLogEntry): AuditFilterCategory => {
    const act = log.action.toUpperCase();
    if (
      act.includes('ANALYST') ||
      act.includes('RESOLV') ||
      act.includes('DISMISS') ||
      act.includes('INVESTIGAT') ||
      act.includes('CONFIRM') ||
      act.includes('ESCALAT')
    ) {
      return 'ANALYST';
    }
    if (
      act.includes('STATUS') ||
      act.includes('STATE') ||
      act.includes('PRIORITY') ||
      act.includes('CANDIDATE')
    ) {
      return 'STATE';
    }
    return 'PIPELINE';
  };

  // Compute category counts for KPI cards and filter tabs
  const stats = useMemo(() => {
    let analystCount = 0;
    let stateCount = 0;
    let pipelineCount = 0;

    logs.forEach((log) => {
      const cat = getCategory(log);
      if (cat === 'ANALYST') analystCount++;
      else if (cat === 'STATE') stateCount++;
      else pipelineCount++;
    });

    return {
      total: logs.length,
      analyst: analystCount,
      state: stateCount,
      pipeline: pipelineCount,
    };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        if (getCategory(log) !== selectedCategory) {
          return false;
        }
      }

      // Search query filter (matches action, entity ID / description, timestamp, actor)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchDesc = log.description.toLowerCase().includes(q);
        const matchTime = log.timestamp.toLowerCase().includes(q);
        const isAnalyst = getCategory(log) === 'ANALYST';
        const matchActor = isAnalyst ? 'analyst'.includes(q) : 'system engine'.includes(q);
        return matchAction || matchDesc || matchTime || matchActor;
      }

      return true;
    });
  }, [logs, selectedCategory, searchQuery]);

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

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('RESOLV')) {
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.35)',
        color: '#10B981',
        label: action,
      };
    }
    if (act.includes('DISMISS')) {
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.35)',
        color: '#F59E0B',
        label: action,
      };
    }
    if (act.includes('STATUS') || act.includes('STATE') || act.includes('PRIORITY')) {
      return {
        bg: 'rgba(139, 92, 246, 0.12)',
        border: 'rgba(139, 92, 246, 0.35)',
        color: '#A78BFA',
        label: action,
      };
    }
    if (act.includes('ANALYST') || act.includes('INVESTIGAT') || act.includes('CONFIRM') || act.includes('ESCALAT')) {
      return {
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.35)',
        color: '#60A5FA',
        label: action,
      };
    }
    return {
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.35)',
      color: '#22D3EE',
      label: action,
    };
  };

  return (
    <div
      className="p-5 sm:p-6 space-y-6 max-w-7xl mx-auto min-h-screen font-sans"
      style={{ color: '#E6EAF2' }}
    >
      {/* ── Top Header ── */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span
              className="text-[11px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                color: '#60A5FA',
              }}
            >
              SOC AUDIT TRAIL
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#9AA4B2' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Audit Logging Active</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
            System Audit Logs
          </h1>
          <p className="text-xs sm:text-sm max-w-3xl" style={{ color: '#9AA4B2' }}>
            Comprehensive activity and operations log capturing analyst triage verdicts, automated status transitions, anomaly correlations, and pipeline trigger telemetry.
          </p>
        </div>

        <button
          onClick={fetchAuditData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg text-white transition-all duration-200 disabled:opacity-50 cursor-pointer self-start md:self-center shadow-lg"
          style={{
            background: '#3B82F6',
            boxShadow: '0 0 24px rgba(59, 130, 246, 0.35)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#2563EB';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6';
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Records'}</span>
        </button>
      </div>

      {/* ── KPI Summary Cards (Electric Blue SOC Hierarchy) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        {/* Total Records */}
        <div
          className="p-4 rounded-xl space-y-2 transition-all duration-200"
          style={{
            background: '#121821',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9AA4B2' }}>
              Total Log Entries
            </span>
            <FileText className="w-4 h-4" style={{ color: '#3B82F6' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.total}</span>
            <span className="text-[10px]" style={{ color: '#6B7785' }}>RECORDS</span>
          </div>
        </div>

        {/* Analyst Actions */}
        <div
          className="p-4 rounded-xl space-y-2 transition-all duration-200"
          style={{
            background: '#121821',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9AA4B2' }}>
              Analyst Actions
            </span>
            <UserCheck className="w-4 h-4" style={{ color: '#10B981' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.analyst}</span>
            <span className="text-[10px]" style={{ color: '#10B981' }}>TRIAGE EVENTS</span>
          </div>
        </div>

        {/* State Transitions */}
        <div
          className="p-4 rounded-xl space-y-2 transition-all duration-200"
          style={{
            background: '#121821',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9AA4B2' }}>
              State & Priority
            </span>
            <ShieldAlert className="w-4 h-4" style={{ color: '#A78BFA' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.state}</span>
            <span className="text-[10px]" style={{ color: '#A78BFA' }}>MUTATIONS</span>
          </div>
        </div>

        {/* Pipeline & Telemetry */}
        <div
          className="p-4 rounded-xl space-y-2 transition-all duration-200"
          style={{
            background: '#121821',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9AA4B2' }}>
              Pipeline Telemetry
            </span>
            <Activity className="w-4 h-4" style={{ color: '#06B6D4' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.pipeline}</span>
            <span className="text-[10px]" style={{ color: '#06B6D4' }}>NORMALIZED</span>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          className="rounded-xl p-4 flex items-center justify-between gap-4 text-xs font-mono"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)',
            color: '#F87171',
          }}
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to synchronize audit records</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(248, 113, 113, 0.8)' }}>
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={fetchAuditData}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FEE2E2',
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── Filter & Search Toolbar ── */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-3 rounded-xl font-mono"
        style={{
          background: '#121821',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'ALL', label: 'All Records', count: stats.total },
              { id: 'ANALYST', label: 'Analyst Actions', count: stats.analyst },
              { id: 'STATE', label: 'State & Priority', count: stats.state },
              { id: 'PIPELINE', label: 'Pipeline / Triggers', count: stats.pipeline },
            ] as const
          ).map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: '#1A2230',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        color: '#60A5FA',
                        boxShadow: '0 0 12px rgba(59, 130, 246, 0.15)',
                      }
                    : {
                        background: 'transparent',
                        border: '1px solid transparent',
                        color: '#9AA4B2',
                      }
                }
              >
                <span>{tab.label}</span>
                <span
                  className="px-1.5 py-0.2 rounded text-[10px] font-bold"
                  style={
                    isActive
                      ? { background: 'rgba(59, 130, 246, 0.25)', color: '#93C5FD' }
                      : { background: '#0B0F14', color: '#6B7785', border: '1px solid rgba(255,255,255,0.05)' }
                  }
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input with Electric Blue Focus State */}
        <div className="relative w-full md:w-80">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#6B7785' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, entity ID, description..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg font-mono transition-all duration-200"
            style={{
              background: '#0B0F14',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#E6EAF2',
              outline: 'none',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = '#3B82F6';
              (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 16px rgba(59, 130, 246, 0.25)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
              (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-200"
              style={{ color: '#9AA4B2' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Audit Table Console ── */}
      <div
        className="rounded-xl overflow-hidden font-mono"
        style={{
          background: '#121821',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
        }}
      >
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-12 rounded-lg animate-pulse"
                style={{ background: '#1A2230' }}
              />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4 font-mono">
            <Filter className="w-12 h-12 mx-auto" style={{ color: '#6B7785' }} />
            <div>
              <h3 className="text-base font-semibold text-white font-heading">
                No matching audit log records
              </h3>
              <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: '#9AA4B2' }}>
                No events match current filter category or query term "{searchQuery}".
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="mt-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all duration-200"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60A5FA',
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className="text-[11px] uppercase tracking-wider font-mono font-semibold"
                  style={{
                    background: '#0B0F14',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                    color: '#9AA4B2',
                  }}
                >
                  <th className="py-3 px-4 w-48">Timestamp</th>
                  <th className="py-3 px-4 w-52">Action / Event</th>
                  <th className="py-3 px-4 w-40">Actor / Origin</th>
                  <th className="py-3 px-4">Log Description / Context</th>
                  <th className="py-3 px-4 w-28 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const badge = getActionBadge(log.action);
                  const isAnalyst = getCategory(log) === 'ANALYST';

                  return (
                    <tr
                      key={idx}
                      className="transition-all duration-150 group"
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(59, 130, 246, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                      }}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap" style={{ color: '#9AA4B2' }}>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5" style={{ color: '#6B7785' }} />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border tracking-wide font-mono"
                          style={{
                            background: badge.bg,
                            borderColor: badge.border,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Actor / Origin */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAnalyst ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{
                              background: '#1A2230',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              color: '#6EE7B7',
                            }}
                          >
                            <User className="w-3 h-3 text-emerald-400" />
                            <span>ANALYST</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{
                              background: '#1A2230',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              color: '#93C5FD',
                            }}
                          >
                            <Terminal className="w-3 h-3 text-blue-400" />
                            <span>SYSTEM ENGINE</span>
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 font-sans text-xs leading-relaxed" style={{ color: '#E6EAF2' }}>
                        <span className="font-mono text-xs">{log.description}</span>
                      </td>

                      {/* Log Status */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                          style={{
                            color: '#34D399',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          RECORDED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div
          className="p-3 flex items-center justify-between text-xs font-mono"
          style={{
            background: '#0B0F14',
            borderTop: '1px solid rgba(255, 255, 255, 0.07)',
            color: '#9AA4B2',
          }}
        >
          <span>
            Showing <strong className="text-white">{filteredLogs.length}</strong> of{' '}
            <strong className="text-white">{logs.length}</strong> total records
          </span>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: '#6B7785' }}>
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>TraceX Autonomous Security Correlation Engine v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audit;
