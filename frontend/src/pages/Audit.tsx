import React, { useEffect, useState, useMemo } from 'react';
import { Search, RefreshCw, AlertCircle, X, FileText } from 'lucide-react';
import { getAuditLog } from '../services/audit';
import type { AuditLogEntry } from '../types/incident';
import AuditTrail from '../components/incidents/AuditTrail';

export const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase().trim();
    return logs.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.timestamp.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Audit Logs</h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {logs.length} System Records
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            System-wide audit trail recording analyst actions, automated state changes, and pipeline triggers.
          </p>
        </div>

        <button
          onClick={fetchAuditData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-md transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between gap-4 text-red-400 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to fetch system audit logs</p>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchAuditData}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Control Bar: Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Showing {filteredLogs.length} of {logs.length} audit entries</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, description, or time..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Audit Trail Component */}
      <AuditTrail
        title="System Audit Console Log"
        entries={filteredLogs}
        loading={loading}
        error={error}
        onRefresh={fetchAuditData}
      />
    </div>
  );
};

export default Audit;
