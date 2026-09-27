import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  Search,
  RefreshCw,
  AlertCircle,
  Clock,
  User,
  Monitor,
  Globe,
  MapPin,
  Database,
  Terminal,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileCode,
} from 'lucide-react';
import { getEvents } from '../services/events';
import type { NormalizedEvent, EventType } from '../types/event';

const ANOMALY_EVENT_TYPES: EventType[] = [
  'mfa_failure',
  'new_device',
  'new_location',
  'privilege_change',
  'large_transfer',
  'admin_action',
];

const PAGE_SIZE = 10;

export const Events: React.FC = () => {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Drawer state
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);

  const fetchEventsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvents();
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to fetch telemetry events');
      }
      setEvents(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await getEvents();
        if (!isMounted) return;
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'Failed to fetch telemetry events');
        }
        setEvents(res.data);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error fetching events');
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

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter((evt) => {
      const matchType = evt.event_type.toLowerCase().includes(q);
      const matchUser = evt.user_id?.toLowerCase().includes(q);
      const matchDevice = evt.device_id?.toLowerCase().includes(q);
      const matchResource = evt.resource?.toLowerCase().includes(q);
      const matchAction = evt.action?.toLowerCase().includes(q);
      return matchType || matchUser || matchDevice || matchResource || matchAction;
    });
  }, [events, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, currentPage]);

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto relative font-sans" style={{ color: '#E6EAF2' }}>
      {/* ── Page Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white font-heading">Telemetry Events</h1>
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold"
              style={{
                background:  'rgba(59, 130, 246, 0.12)',
                border:      '1px solid rgba(59, 130, 246, 0.3)',
                color:       '#60A5FA',
              }}
            >
              {events.length} Streamed
            </span>
          </div>
          <p className="text-xs mt-1 font-body" style={{ color: '#9AA4B2' }}>
            Normalized security log stream, user activity logs, and raw event parameters.
          </p>
        </div>

        <button
          onClick={fetchEventsData}
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

      {/* ── Global Error Banner ── */}
      {error && (
        <div
          className="rounded-xl p-3 flex items-center justify-between gap-4 text-xs font-mono"
          style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#F87171' }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold">Unable to fetch telemetry events</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(248, 113, 113, 0.7)' }}>{error}</p>
            </div>
          </div>
          <button
            onClick={fetchEventsData}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200"
            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Control Bar: Search Input ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl font-mono"
        style={{ background: '#121821', border: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: '#9AA4B2' }}>
          <Activity className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
          <span>
            Showing {paginatedEvents.length} of {filteredEvents.length} filtered events
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7785' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search user, device, type..."
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
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-200"
              style={{ color: '#9AA4B2' }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Events Table Container ── */}
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
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs space-y-1.5" style={{ color: '#9AA4B2' }}>
            <Activity className="w-8 h-8 mx-auto mb-1" style={{ color: '#6B7785' }} />
            <p className="text-white font-semibold">No telemetry events match query</p>
            <p className="text-[11px]">Clear search filter to inspect log entries.</p>
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
                  <th className="py-2.5 px-3.5 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3.5 font-semibold">Event Type</th>
                  <th className="py-2.5 px-3.5 font-semibold">User ID</th>
                  <th className="py-2.5 px-3.5 font-semibold">Device ID</th>
                  <th className="py-2.5 px-3.5 font-semibold">Resource</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((evt) => {
                  const isAnomaly =
                    ANOMALY_EVENT_TYPES.includes(evt.event_type) || evt.metadata?.anomaly === true;

                  return (
                    <tr
                      key={evt.event_id}
                      onClick={() => setSelectedEvent(evt)}
                      className="cursor-pointer group transition-all duration-200"
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(59, 130, 246, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                      }}
                    >
                      <td className="py-2.5 px-3.5 flex items-center gap-1.5" style={{ color: '#9AA4B2' }}>
                        <Clock className="w-3 h-3" style={{ color: '#6B7785' }} />
                        {formatTimestamp(evt.timestamp)}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border"
                          style={
                            isAnomaly
                              ? {
                                  background:  'rgba(245, 158, 11, 0.12)',
                                  borderColor: 'rgba(245, 158, 11, 0.35)',
                                  color:       '#FCD34D',
                                }
                              : {
                                  background:  '#1A2230',
                                  borderColor: 'rgba(255, 255, 255, 0.08)',
                                  color:       '#E6EAF2',
                                }
                          }
                        >
                          {evt.event_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5" style={{ color: '#E6EAF2' }}>
                        {evt.user_id ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" style={{ color: '#9AA4B2' }} />
                            <span style={{ color: '#60A5FA' }}>{evt.user_id}</span>
                          </span>
                        ) : (
                          <span style={{ color: '#6B7785' }}>-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5" style={{ color: '#E6EAF2' }}>
                        {evt.device_id ? (
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" style={{ color: '#9AA4B2' }} />
                            {evt.device_id}
                          </span>
                        ) : (
                          <span style={{ color: '#6B7785' }}>-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 max-w-xs truncate" style={{ color: '#9AA4B2' }}>
                        {evt.resource ? (
                          <span
                            className="px-1.5 py-0.5 rounded border text-xs"
                            style={{
                              background:  '#0B0F14',
                              borderColor: 'rgba(255, 255, 255, 0.07)',
                              color:       '#E6EAF2',
                            }}
                          >
                            {evt.resource}
                          </span>
                        ) : (
                          <span style={{ color: '#6B7785' }}>-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {isAnomaly ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border"
                            style={{
                              background:  'rgba(239, 68, 68, 0.1)',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              color:       '#F87171',
                            }}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            ANOMALY
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-semibold" style={{ color: '#9AA4B2' }}>
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Bar ── */}
        {filteredEvents.length > PAGE_SIZE && (
          <div
            className="p-2.5 flex items-center justify-between text-xs font-mono"
            style={{
              background:   '#0B0F14',
              borderTop:    '1px solid rgba(255, 255, 255, 0.07)',
              color:        '#9AA4B2',
            }}
          >
            <span>
              Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg border transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  background:  '#121821',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  color:       '#E6EAF2',
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg border transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  background:  '#121821',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  color:       '#E6EAF2',
                }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-in Event Details Panel / Drawer ── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex justify-end font-mono backdrop-blur-xs"
          style={{ background: 'rgba(3, 3, 4, 0.75)' }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-lg h-full p-5 space-y-5 overflow-y-auto shadow-2xl"
            style={{
              background:  'var(--color-surface)',
              borderLeft:  '1px solid rgba(30, 41, 59, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.7)' }}
            >
              <div className="space-y-1">
                <span
                  className="text-xs px-2 py-0.5 rounded-md font-bold border"
                  style={{
                    color:       '#60A5FA',
                    background:  'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 0.25)',
                  }}
                >
                  {selectedEvent.event_id}
                </span>
                <h2 className="text-base font-bold text-white uppercase font-heading">
                  {selectedEvent.event_type}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg border transition-colors cursor-pointer"
                style={{
                  background:  'rgba(3, 3, 4, 0.7)',
                  borderColor: 'rgba(30, 41, 59, 0.8)',
                  color:       'var(--color-muted)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#60A5FA';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)';
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Event Field Details Grid */}
            <div className="space-y-3 text-xs">
              <div
                className="p-2.5 rounded-lg space-y-0.5"
                style={{ background: 'rgba(3, 3, 4, 0.7)', border: '1px solid rgba(30, 41, 59, 0.7)' }}
              >
                <span className="text-[9px] uppercase" style={{ color: 'var(--color-muted)' }}>Timestamp</span>
                <p className="text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
                  {selectedEvent.timestamp}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className="p-2.5 rounded-lg space-y-0.5"
                  style={{ background: 'rgba(3, 3, 4, 0.7)', border: '1px solid rgba(30, 41, 59, 0.7)' }}
                >
                  <span className="text-[9px] uppercase" style={{ color: 'var(--color-muted)' }}>User ID</span>
                  <p className="text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                    {selectedEvent.user_id || '-'}
                  </p>
                </div>

                <div
                  className="p-2.5 rounded-lg space-y-0.5"
                  style={{ background: 'rgba(3, 3, 4, 0.7)', border: '1px solid rgba(30, 41, 59, 0.7)' }}
                >
                  <span className="text-[9px] uppercase" style={{ color: 'var(--color-muted)' }}>Device ID</span>
                  <p className="text-slate-200 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                    {selectedEvent.device_id || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className="p-2.5 rounded-lg space-y-0.5"
                  style={{ background: 'rgba(3, 3, 4, 0.7)', border: '1px solid rgba(30, 41, 59, 0.7)' }}
                >
                  <span className="text-[9px] uppercase" style={{ color: 'var(--color-muted)' }}>IP Address</span>
                  <p className="text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                    {selectedEvent.ip_address || '-'}
                  </p>
                </div>

                <div
                  className="p-2.5 rounded-lg space-y-0.5 font-sans"
                  style={{ background: 'rgba(3, 3, 4, 0.7)', border: '1px solid rgba(30, 41, 59, 0.7)' }}
                >
                  <span className="text-[9px] uppercase font-mono" style={{ color: 'var(--color-muted)' }}>Location</span>
                  <p className="text-slate-200 flex items-center gap-1.5 font-mono">
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                    {selectedEvent.location || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className="p-2.5 rounded-lg space-y-0.5"
                  style={{ background: 'rgba(3, 3, 4, 0.7)', border: '1px solid rgba(30, 41, 59, 0.7)' }}
                >
                  <span className="text-[9px] uppercase" style={{ color: 'var(--color-muted)' }}>Session ID</span>
                  <p className="text-slate-200 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                    {selectedEvent.session_id || '-'}
                  </p>
                </div>

                <div
                  className="p-2.5 rounded-lg space-y-0.5"
                  style={{ background: 'rgba(3, 3, 4, 0.7)', border: '1px solid rgba(30, 41, 59, 0.7)' }}
                >
                  <span className="text-[9px] uppercase" style={{ color: 'var(--color-muted)' }}>Action</span>
                  <p className="text-slate-200 capitalize">
                    {selectedEvent.action || '-'}
                  </p>
                </div>
              </div>

              <div
                className="p-2.5 rounded-lg space-y-0.5"
                style={{ background: 'rgba(3, 3, 4, 0.7)', border: '1px solid rgba(30, 41, 59, 0.7)' }}
              >
                <span className="text-[9px] uppercase" style={{ color: 'var(--color-muted)' }}>Target Resource</span>
                <p className="text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
                  {selectedEvent.resource || '-'}
                </p>
              </div>

              {/* Event Metadata */}
              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase" style={{ color: 'var(--color-muted)' }}>
                    <FileCode className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
                    <span>Raw Event Metadata Payload</span>
                  </div>
                  <pre
                    className="p-3 rounded-lg text-xs font-mono overflow-x-auto"
                    style={{
                      background: 'rgba(3, 3, 4, 0.8)',
                      border:     '1px solid rgba(30, 41, 59, 0.7)',
                      color:      '#CBD5E1',
                    }}
                  >
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
