import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  Zap,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Shield,
  Layers,
  Terminal,
  User,
  Clock,
} from 'lucide-react';
import { getIncidents } from '../services/incidents';
import { getEvents } from '../services/events';
import type { Incident } from '../types/incident';
import type { NormalizedEvent, EventType } from '../types/event';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/incidents/StatusBadge';

const ANOMALY_EVENT_TYPES: EventType[] = [
  'mfa_failure',
  'new_device',
  'new_location',
  'privilege_change',
  'large_transfer',
  'admin_action',
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [incidentsRes, eventsRes] = await Promise.all([getIncidents(), getEvents()]);

      if (!incidentsRes.success) {
        throw new Error(incidentsRes.error?.message || 'Failed to fetch incidents');
      }

      if (!eventsRes.success) {
        throw new Error(eventsRes.error?.message || 'Failed to fetch telemetry events');
      }

      setIncidents(incidentsRes.data || []);
      setEvents(eventsRes.data || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [incidentsRes, eventsRes] = await Promise.all([getIncidents(), getEvents()]);

        if (!isMounted) return;

        if (!incidentsRes.success) {
          throw new Error(incidentsRes.error?.message || 'Failed to fetch incidents');
        }

        if (!eventsRes.success) {
          throw new Error(eventsRes.error?.message || 'Failed to fetch telemetry events');
        }

        setIncidents(incidentsRes.data || []);
        setEvents(eventsRes.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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

  // Derived Stat Card Metrics
  const totalEventsCount = events.length;
  const anomaliesCount = events.filter(
    (evt) => ANOMALY_EVENT_TYPES.includes(evt.event_type) || evt.metadata?.anomaly === true
  ).length;
  const candidatesCount = incidents.filter((inc) => inc.status === 'INCIDENT_CANDIDATE').length;
  const highPriorityCount = incidents.filter(
    (inc) => inc.status === 'HIGH_PRIORITY' || inc.priority >= 70
  ).length;

  const getPriorityPill = (score: number) => {
    let colorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (score >= 70) colorClass = 'text-red-400 bg-red-500/10 border-red-500/30';
    else if (score >= 40) colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';

    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${colorClass}`}>
          {score}
        </span>
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
          <div
            className={`h-full ${
              score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
      </div>
    );
  };

  const formatEventTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Security Overview</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LIVE
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time threat detection, automated incident clustering, and telemetry metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Last updated: <span className="text-slate-300">{lastUpdated}</span>
            </span>
          )}
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between gap-4 text-red-400 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load dashboard data</p>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Four Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={totalEventsCount}
          subtitle="Processed in current pipeline"
          icon={Activity}
          colorScheme="blue"
          loading={loading}
        />
        <StatCard
          title="Anomalies"
          value={anomaliesCount}
          subtitle="Suspicious behavior flags"
          icon={AlertTriangle}
          colorScheme="amber"
          loading={loading}
        />
        <StatCard
          title="Incident Candidates"
          value={candidatesCount}
          subtitle="Under automated evaluation"
          icon={ShieldAlert}
          colorScheme="purple"
          loading={loading}
        />
        <StatCard
          title="High Priority"
          value={highPriorityCount}
          subtitle="Requires immediate analyst action"
          icon={Zap}
          colorScheme="red"
          loading={loading}
        />
      </div>

      {/* Main Content Grid: Active Incidents & Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents List/Table (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold text-slate-100">Active Incidents</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {incidents.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="py-12 text-center space-y-3 border border-dashed border-slate-800 rounded-lg bg-slate-950/40">
              <Shield className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <p className="text-sm font-medium text-slate-300">No active incidents</p>
                <p className="text-xs text-slate-500 mt-1">
                  All security events are within normal operational thresholds.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Incident ID</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3 text-right">Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {incidents.map((inc) => (
                    <tr
                      key={inc.incident_id}
                      onClick={() => navigate(`/incidents/${inc.incident_id}`)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3 font-mono font-semibold text-slate-200 group-hover:text-blue-400">
                        {inc.incident_id}
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate font-medium text-slate-200">
                        {inc.title}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="py-3 px-3">{getPriorityPill(inc.priority)}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        <span className="inline-flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700/50">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {inc.event_ids.length}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Telemetry Stream (1 Column) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">Live Telemetry</h2>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Explore
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center space-y-3 border border-dashed border-slate-800 rounded-lg bg-slate-950/40">
              <Activity className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <p className="text-sm font-medium text-slate-300">No telemetry events</p>
                <p className="text-xs text-slate-500 mt-1">
                  Waiting for incoming security telemetry log stream.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {events.slice(0, 10).map((evt) => {
                const isAnomaly = ANOMALY_EVENT_TYPES.includes(evt.event_type);
                return (
                  <div
                    key={evt.event_id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatEventTime(evt.timestamp)}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          isAnomaly
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {evt.event_type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 pt-0.5">
                      {evt.user_id ? (
                        <span className="flex items-center gap-1 text-slate-300 font-mono">
                          <User className="w-3 h-3 text-slate-500" />
                          {evt.user_id}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">-</span>
                      )}

                      {evt.resource ? (
                        <span className="font-mono text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 truncate max-w-[140px]">
                          {evt.resource}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
