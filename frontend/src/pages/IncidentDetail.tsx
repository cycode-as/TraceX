import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Clock,
  Layers,
  CheckCircle2,
  Zap,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import {
  getIncident,
  getIncidentTimeline,
  performAnalystAction,
} from '../services/incidents';
import type { Incident, AnalystActionType, IncidentStatus } from '../types/incident';
import type { NormalizedEvent } from '../types/event';
import StatusBadge from '../components/incidents/StatusBadge';
import Timeline from '../components/incidents/Timeline';
import PriorityBreakdown from '../components/incidents/PriorityBreakdown';

interface ActionToast {
  message: string;
  type: 'success' | 'error';
}

const PROGRESSION_STEPS = [
  { id: 'ANOMALY', label: 'Anomaly' },
  { id: 'SUSPICIOUS_PATTERN', label: 'Suspicious Pattern' },
  { id: 'INCIDENT_CANDIDATE', label: 'Incident Candidate' },
  { id: 'HIGH_PRIORITY', label: 'High Priority' },
];

export const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pending action state for spinner
  const [pendingAction, setPendingAction] = useState<AnalystActionType | null>(null);
  const [toast, setToast] = useState<ActionToast | null>(null);

  const fetchDetailData = async () => {
    if (!id) return;
    const targetId = id;
    setLoading(true);
    setError(null);

    try {
      const [incRes, timeRes] = await Promise.all([
        getIncident(targetId),
        getIncidentTimeline(targetId),
      ]);

      if (!incRes.success || !incRes.data) {
        throw new Error(incRes.error?.message || 'Incident not found');
      }

      setIncident(incRes.data);
      if (timeRes.success && timeRes.data) {
        setTimeline(timeRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const targetId = id;
    let isMounted = true;

    async function init() {
      try {
        const [incRes, timeRes] = await Promise.all([
          getIncident(targetId),
          getIncidentTimeline(targetId),
        ]);

        if (!isMounted) return;

        if (!incRes.success || !incRes.data) {
          throw new Error(incRes.error?.message || 'Incident not found');
        }

        setIncident(incRes.data);
        if (timeRes.success && timeRes.data) {
          setTimeline(timeRes.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load incident details');
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
  }, [id]);

  const handleAction = async (actionType: AnalystActionType) => {
    if (!id || !incident) return;
    const targetId = id;
    setPendingAction(actionType);
    setToast(null);

    try {
      const res = await performAnalystAction(targetId, { action: actionType });

      if (res.success && res.data) {
        // Map analyst action to updated status for UI feedback
        let updatedStatus: IncidentStatus = incident.status;
        if (actionType === 'CONFIRM') updatedStatus = 'CONFIRMED';
        else if (actionType === 'DISMISS') updatedStatus = 'DISMISSED';
        else if (actionType === 'RESOLVE') updatedStatus = 'RESOLVED';
        else if (actionType === 'ESCALATE') updatedStatus = 'HIGH_PRIORITY';
        else if (actionType === 'INVESTIGATE') updatedStatus = 'INCIDENT_CANDIDATE';

        setIncident((prev) => (prev ? { ...prev, status: updatedStatus } : prev));
        setToast({
          message: `Analyst action '${actionType}' completed successfully.`,
          type: 'success',
        });
      } else {
        throw new Error(res.error?.message || 'Failed to execute analyst action');
      }
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'Action failed',
        type: 'error',
      });
    } finally {
      setPendingAction(null);
    }
  };

  // Determine current active index in state progression
  const getActiveStepIndex = (status?: IncidentStatus) => {
    switch (status) {
      case 'HIGH_PRIORITY':
        return 3;
      case 'INCIDENT_CANDIDATE':
      case 'CONFIRMED':
        return 2;
      case 'RESOLVED':
      case 'DISMISSED':
        return 3;
      default:
        return 1;
    }
  };

  const activeStepIndex = getActiveStepIndex(incident?.status);

  // Compute summary metrics from timeline
  const getTimeWindow = () => {
    if (!timeline.length) return 'N/A';
    try {
      const first = new Date(timeline[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const last = new Date(timeline[timeline.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${first} — ${last}`;
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded" />
        <div className="h-24 bg-slate-800/60 rounded-xl" />
        <div className="h-16 bg-slate-800/40 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-800/50 rounded-xl" />
          <div className="h-96 bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents Queue
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-slate-100">Incident Not Found</h2>
            <p className="text-xs text-slate-400 mt-1">
              {error || `No incident found matching identifier '${id}'`}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={fetchDetailData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              Retry Load
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              Return to Incidents Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back Link Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents Queue
        </Link>
        <span className="text-xs font-mono text-slate-500">
          Created: {new Date(incident.created_at).toLocaleString()}
        </span>
      </div>

      {/* Action Toast Feedback */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-200 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/30">
                {incident.incident_id}
              </span>
              <StatusBadge status={incident.status} size="md" />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              {incident.title}
            </h1>
          </div>

          {/* Prominent Priority Score + Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            {/* Score Card */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-center">
                <span className="text-2xl font-bold font-mono text-red-400 leading-none block">
                  {incident.priority}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mt-0.5">
                  Priority Score
                </span>
              </div>
              <div className="w-1.5 h-8 bg-red-500 rounded-full" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleAction('INVESTIGATE')}
                disabled={pendingAction !== null}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {pendingAction === 'INVESTIGATE' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                )}
                Investigate
              </button>

              <button
                onClick={() => handleAction('CONFIRM')}
                disabled={pendingAction !== null}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-lg border border-blue-500/40 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {pendingAction === 'CONFIRM' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                )}
                Confirm
              </button>

              <button
                onClick={() => handleAction('ESCALATE')}
                disabled={pendingAction !== null}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold rounded-lg border border-red-500/40 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {pendingAction === 'ESCALATE' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                )}
                Escalate
              </button>

              <button
                onClick={() => handleAction('DISMISS')}
                disabled={pendingAction !== null}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {pendingAction === 'DISMISS' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* State Progression Indicator Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Automated State Progression
          </span>
          <span className="text-slate-300 font-semibold">
            Stage {activeStepIndex + 1} of {PROGRESSION_STEPS.length}
          </span>
        </div>

        <div className="relative flex items-center justify-between pt-2">
          {/* Background Bar */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800 w-full rounded z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded transition-all duration-300 z-0"
            style={{
              width: `${(activeStepIndex / (PROGRESSION_STEPS.length - 1)) * 100}%`,
            }}
          />

          {PROGRESSION_STEPS.map((step, idx) => {
            const isCompleted = idx <= activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            return (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center group cursor-default"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 transition-all duration-200 ${
                    isCurrent
                      ? 'bg-blue-600 border-slate-900 text-white shadow-lg shadow-blue-500/50 scale-110'
                      : isCompleted
                      ? 'bg-slate-900 border-blue-500 text-blue-400'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-[11px] font-medium mt-2 transition-colors ${
                    isCurrent
                      ? 'text-blue-400 font-semibold'
                      : isCompleted
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Incident Overview & Scope</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Incident <strong className="text-slate-100 font-mono">{incident.incident_id}</strong> represents a cluster of{' '}
          <strong className="text-slate-100 font-mono">{incident.event_ids.length} telemetry events</strong> recorded within the time window{' '}
          <span className="font-mono text-slate-200">{getTimeWindow()}</span>. Initial detection identified multi-stage suspicious activity including authentication anomalies and access shifts.
        </p>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Events: <strong className="text-slate-300">{incident.event_ids.length}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Time window: <strong className="text-slate-300">{getTimeWindow()}</strong>
          </span>
        </div>
      </div>

      {/* Two-Column Main Layout: Timeline (Left) & Priority Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical Event Timeline (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-slate-100">Telemetry Timeline</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {timeline.length} events
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">Click item to inspect details</span>
          </div>

          <Timeline events={timeline} />
        </div>

        {/* Investigation Priority Breakdown (1 Column) */}
        <div className="space-y-6">
          <PriorityBreakdown score={incident.priority} />
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
