import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Layers, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import type { SimulationState, Incident } from '../../types/incident';
import type { Priority } from '../../types/graph';
import StatusBadge from '../incidents/StatusBadge';

interface WhatChangedProps {
  previousState?: SimulationState | null;
  currentState: SimulationState;
}

export const WhatChanged: React.FC<WhatChangedProps> = ({ previousState, currentState }) => {
  const navigate = useNavigate();

  // Extract score from current & previous state safely
  const currentScore =
    typeof currentState.priority === 'object' && 'score' in currentState.priority
      ? (currentState.priority as Priority).score
      : 0;

  const previousScore =
    previousState && typeof previousState.priority === 'object' && 'score' in previousState.priority
      ? (previousState.priority as Priority).score
      : 0;

  const scoreDelta = currentScore - previousScore;

  // Incident ID if created
  const incidentObj = currentState.incident as Incident | undefined;
  const incidentId = incidentObj?.incident_id;

  const currentEventCount = currentState.processed_events?.length || 0;
  const previousEventCount = previousState?.processed_events?.length || 0;

  const currentStateLabel = currentState.state || 'INCIDENT_CANDIDATE';
  const previousStateLabel = previousState?.state || 'INCIDENT_CANDIDATE';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">State Delta — What Changed?</h2>
        </div>
        {incidentId && (
          <button
            onClick={() => navigate(`/incidents/${incidentId}`)}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            <span>View Incident {incidentId}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of Delta Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Priority Score Delta */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
          <span className="text-slate-400 font-mono text-[10px] uppercase block">
            Investigation Priority
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-400 text-sm">{previousScore}</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="font-mono font-bold text-slate-100 text-lg">{currentScore}</span>
            {scoreDelta !== 0 && (
              <span
                className={`ml-auto font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  scoreDelta > 0
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
              </span>
            )}
          </div>
        </div>

        {/* Incident Status Delta */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
          <span className="text-slate-400 font-mono text-[10px] uppercase block">
            Incident State
          </span>
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <StatusBadge status={previousStateLabel} size="sm" />
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <StatusBadge status={currentStateLabel} size="sm" />
          </div>
        </div>

        {/* Event Count Delta */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
          <span className="text-slate-400 font-mono text-[10px] uppercase block">
            Processed Telemetry Events
          </span>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-mono font-bold text-slate-100 text-base">
              {currentEventCount} events
            </span>
            {currentEventCount !== previousEventCount && (
              <span className="ml-auto text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                +{currentEventCount - previousEventCount}
              </span>
            )}
          </div>
        </div>

        {/* Evidence Findings Count */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
          <span className="text-slate-400 font-mono text-[10px] uppercase block">
            Evidence Findings
          </span>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono font-bold text-slate-100 text-base">
              {Math.min(currentEventCount, 4)} items
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatChanged;
