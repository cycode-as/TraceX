import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  AlertCircle,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Clock,
  X,
  Filter,
} from 'lucide-react';
import { getIncidents } from '../services/incidents';
import type { Incident } from '../types/incident';
import StatusBadge from '../components/incidents/StatusBadge';

type FilterTab = 'All' | 'High' | 'Investigating' | 'Unresolved';
type SortField = 'priority' | 'updated_at';
type SortDirection = 'asc' | 'desc';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (isNaN(diffMs) || diffMs < 0) {
      return date.toLocaleDateString();
    }

    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

// Extract entity / primary user ID from incident title or fallback
function extractEntity(incident: Incident): string {
  const match = incident.title.match(/USR-\d+/i);
  if (match) return match[0].toUpperCase();
  return 'USR-101';
}

export const Incidents: React.FC = () => {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting state
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchIncidentsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getIncidents();
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to fetch incidents list');
      }
      setIncidents(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while loading incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await getIncidents();
        if (!isMounted) return;
        if (!res.success) {
          throw new Error(res.error?.message || 'Failed to fetch incidents list');
        }
        setIncidents(res.data || []);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred while loading incidents');
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

  // Compute tab counts
  const tabCounts = useMemo(() => {
    return {
      All: incidents.length,
      High: incidents.filter((i) => i.status === 'HIGH_PRIORITY' || i.priority >= 70).length,
      Investigating: incidents.filter(
        (i) => i.status === 'INCIDENT_CANDIDATE' || i.status === 'CONFIRMED'
      ).length,
      Unresolved: incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'DISMISSED').length,
    };
  }, [incidents]);

  // Filtered and Sorted Incidents
  const filteredIncidents = useMemo(() => {
    return incidents
      .filter((inc) => {
        // Tab Filtering
        if (activeTab === 'High' && !(inc.status === 'HIGH_PRIORITY' || inc.priority >= 70)) {
          return false;
        }
        if (
          activeTab === 'Investigating' &&
          !(inc.status === 'INCIDENT_CANDIDATE' || inc.status === 'CONFIRMED')
        ) {
          return false;
        }
        if (
          activeTab === 'Unresolved' &&
          (inc.status === 'RESOLVED' || inc.status === 'DISMISSED')
        ) {
          return false;
        }

        // Search Query Filtering
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesId = inc.incident_id.toLowerCase().includes(q);
          const matchesTitle = inc.title.toLowerCase().includes(q);
          const matchesStatus = inc.status.toLowerCase().includes(q);
          if (!matchesId && !matchesTitle && !matchesStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'priority') {
          comp = a.priority - b.priority;
        } else if (sortField === 'updated_at') {
          comp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        }
        return sortDirection === 'asc' ? comp : -comp;
      });
  }, [incidents, activeTab, searchQuery, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getPriorityPill = (score: number) => {
    const s =
      score >= 70
        ? { color: '#F87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', bar: '#EF4444' }
        : score >= 40
        ? { color: '#FCD34D', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', bar: '#F59E0B' }
        : { color: '#60A5FA', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', bar: '#3B82F6' };

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
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: s.bar }} />
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto font-sans" style={{ color: '#E6EAF2' }}>
      {/* ── Page Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white font-heading">Incidents</h1>
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold"
              style={{
                background:  'rgba(59, 130, 246, 0.12)',
                border:      '1px solid rgba(59, 130, 246, 0.3)',
                color:       '#60A5FA',
              }}
            >
              {incidents.length} Total
            </span>
          </div>
          <p className="text-xs mt-1 font-body" style={{ color: '#9AA4B2' }}>
            Security incident queue, threat triage, and active response management.
          </p>
        </div>

        <button
          onClick={fetchIncidentsData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all duration-200 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          style={{ background: '#121821', borderColor: 'rgba(255, 255, 255, 0.08)', color: '#E6EAF2' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59, 130, 246, 0.4)';
            (e.currentTarget as HTMLButtonElement).style.color = '#60A5FA';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
            (e.currentTarget as HTMLButtonElement).style.color = '#E6EAF2';
          }}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} style={{ color: loading ? '#60A5FA' : 'inherit' }} />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          className="rounded-xl p-3 flex items-center justify-between gap-4 text-xs font-mono"
          style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171' }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold">Unable to fetch incidents queue</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(248, 113, 113, 0.8)' }}>{error}</p>
            </div>
          </div>
          <button
            onClick={fetchIncidentsData}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200"
            style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FEE2E2' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Control Bar: Tabs + Search ── */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 rounded-xl font-mono"
        style={{ background: '#121821', border: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'High', 'Investigating', 'Unresolved'] as FilterTab[]).map((tab) => {
            const count = tabCounts[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-all duration-200"
                style={
                  isActive
                    ? {
                        background:  '#1A2230',
                        border:      '1px solid rgba(59, 130, 246, 0.5)',
                        color:       '#60A5FA',
                        boxShadow:   '0 0 12px rgba(59, 130, 246, 0.15)',
                      }
                    : {
                        background:  'transparent',
                        border:      '1px solid transparent',
                        color:       '#9AA4B2',
                      }
                }
              >
                <span>{tab}</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={
                    isActive
                      ? { background: 'rgba(59, 130, 246, 0.25)', color: '#93C5FD' }
                      : { background: '#0B0F14', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#6B7785' }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7785' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by ID, title, status..."
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg font-mono transition-all duration-200"
            style={{
              background:   '#0B0F14',
              border:       '1px solid rgba(255, 255, 255, 0.08)',
              color:        '#E6EAF2',
              outline:      'none',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = '#3B82F6';
              (e.currentTarget as HTMLInputElement).style.boxShadow   = '0 0 16px rgba(59, 130, 246, 0.25)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
              (e.currentTarget as HTMLInputElement).style.boxShadow   = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-200"
              style={{ color: '#9AA4B2' }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Table Panel ── */}
      <div
        className="rounded-xl overflow-hidden font-mono"
        style={{ background: '#121821', border: '1px solid rgba(255, 255, 255, 0.07)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)' }}
      >
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-10 rounded-lg animate-pulse"
                style={{ background: '#1A2230' }}
              />
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="py-12 text-center space-y-2 px-4 font-mono">
            <Filter className="w-10 h-10 mx-auto" style={{ color: '#6B7785' }} />
            <div>
              <h3 className="text-sm font-medium text-white font-heading">No incidents match active filters</h3>
              <p className="text-xs mt-0.5 max-w-sm mx-auto" style={{ color: '#9AA4B2' }}>
                Reset search query or filter tab.
              </p>
            </div>
            {(searchQuery || activeTab !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setActiveTab('All'); }}
                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all duration-200"
                style={{
                  background:  'rgba(59, 130, 246, 0.1)',
                  border:      '1px solid rgba(59, 130, 246, 0.3)',
                  color:       '#60A5FA',
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr
                  className="font-mono text-[11px] uppercase tracking-wider font-semibold"
                  style={{
                    background:   '#0B0F14',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                    color:        '#9AA4B2',
                  }}
                >
                  <th className="py-2.5 px-3.5 font-semibold">Incident ID</th>
                  <th className="py-2.5 px-3.5 font-semibold">Title</th>
                  <th className="py-2.5 px-3.5 font-semibold">Status</th>
                  <th
                    className="py-2.5 px-3.5 font-semibold cursor-pointer select-none transition-colors duration-200"
                    onClick={() => toggleSort('priority')}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableCellElement).style.color = '#60A5FA'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableCellElement).style.color = '#9AA4B2'; }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Priority</span>
                      {sortField === 'priority' ? (
                        sortDirection === 'desc'
                          ? <ArrowDown className="w-3 h-3 text-blue-400" />
                          : <ArrowUp className="w-3 h-3 text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3" style={{ color: '#6B7785' }} />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-3.5 font-semibold">Entity</th>
                  <th className="py-2.5 px-3.5 font-semibold text-center">Events</th>
                  <th
                    className="py-2.5 px-3.5 font-semibold cursor-pointer select-none transition-colors duration-200 text-right"
                    onClick={() => toggleSort('updated_at')}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableCellElement).style.color = '#60A5FA'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableCellElement).style.color = '#9AA4B2'; }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Updated</span>
                      {sortField === 'updated_at' ? (
                        sortDirection === 'desc'
                          ? <ArrowDown className="w-3 h-3 text-blue-400" />
                          : <ArrowUp className="w-3 h-3 text-blue-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3" style={{ color: '#6B7785' }} />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((inc) => {
                  const entity = extractEntity(inc);
                  return (
                    <tr
                      key={inc.incident_id}
                      onClick={() => navigate(`/incidents/${inc.incident_id}`)}
                      className="cursor-pointer group transition-all duration-200 font-mono"
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(59, 130, 246, 0.04)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td
                        className="py-2.5 px-3.5 font-mono font-semibold transition-colors group-hover:underline"
                        style={{ color: '#60A5FA' }}
                      >
                        {inc.incident_id}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium max-w-sm truncate" style={{ color: '#E6EAF2' }}>
                        {inc.title}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="py-2.5 px-3.5">{getPriorityPill(inc.priority)}</td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                          style={{
                            background:  '#1A2230',
                            border:      '1px solid rgba(255, 255, 255, 0.06)',
                            color:       '#E6EAF2',
                          }}
                        >
                          <User className="w-3 h-3" style={{ color: '#9AA4B2' }} />
                          {entity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            background:  '#1A2230',
                            border:      '1px solid rgba(255, 255, 255, 0.06)',
                            color:       '#E6EAF2',
                          }}
                        >
                          <Layers className="w-3 h-3" style={{ color: '#9AA4B2' }} />
                          {inc.event_ids.length}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-xs" style={{ color: '#9AA4B2' }}>
                        <span className="inline-flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" style={{ color: '#6B7785' }} />
                          {formatRelativeTime(inc.updated_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Incidents;
