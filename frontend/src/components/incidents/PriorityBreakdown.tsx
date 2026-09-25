import React from 'react';
import { ShieldAlert, Zap, Info } from 'lucide-react';
import type { Priority, PriorityFactors } from '../../types/graph';

interface PriorityBreakdownProps {
  priority?: Priority;
  score?: number;
}

const DEFAULT_FACTORS: PriorityFactors = {
  behavioral_anomaly: 24,
  correlation_strength: 18,
  asset_criticality: 17,
  incident_progression: 14,
  evidence_strength: 13,
};

const FACTOR_LABELS: Record<keyof PriorityFactors, { name: string; max: number; desc: string }> = {
  behavioral_anomaly: {
    name: 'Behavioral Anomaly',
    max: 30,
    desc: 'Deviations from user baseline & location anomalies',
  },
  correlation_strength: {
    name: 'Correlation Strength',
    max: 25,
    desc: 'Temporal and session alignment across events',
  },
  asset_criticality: {
    name: 'Asset Criticality',
    max: 20,
    desc: 'Sensitivity of target databases or vaults',
  },
  incident_progression: {
    name: 'Incident Progression',
    max: 15,
    desc: 'Sequence length & privilege escalation chain',
  },
  evidence_strength: {
    name: 'Evidence Strength',
    max: 10,
    desc: 'Multi-source verification & telemetry confidence',
  },
};

export const PriorityBreakdown: React.FC<PriorityBreakdownProps> = ({ priority, score: propScore }) => {
  const score = priority?.score ?? propScore ?? 86;
  const factors = priority?.factors ?? DEFAULT_FACTORS;

  let scoreColorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  let barColorClass = 'bg-blue-500';
  let labelText = priority?.label ?? 'HIGH';

  if (score >= 70) {
    scoreColorClass = 'text-red-400 bg-red-500/10 border-red-500/30';
    barColorClass = 'bg-red-500';
    labelText = 'HIGH';
  } else if (score >= 40) {
    scoreColorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    barColorClass = 'bg-amber-500';
    labelText = 'MEDIUM';
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">Investigation Priority</h2>
            <p className="text-xs text-slate-400">Analyst triage urgency score (not attack probability)</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{labelText}</span>
        </div>
      </div>

      {/* Main Overall Score Display */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-950/70 border border-slate-800">
        <div className={`p-4 rounded-xl border text-center shrink-0 ${scoreColorClass}`}>
          <span className="text-3xl font-bold font-mono tracking-tight">{score}</span>
          <span className="text-[10px] block font-mono text-slate-400 uppercase mt-0.5">/ 100</span>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1 text-slate-200 font-semibold">
            <span>Urgency Assessment</span>
            <Info className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Priority score indicates the recommended order for analyst review. High scores reflect multi-factor correlations requiring immediate triage.
          </p>
        </div>
      </div>

      {/* Factor Breakdown Bars */}
      <div className="space-y-3 pt-1">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Contributing Risk Factors</h3>

        <div className="space-y-3">
          {(Object.keys(FACTOR_LABELS) as (keyof PriorityFactors)[]).map((key) => {
            const factorInfo = FACTOR_LABELS[key];
            const points = factors[key] ?? 0;
            const percentage = Math.min(100, Math.round((points / factorInfo.max) * 100));

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{factorInfo.name}</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    <strong className="text-slate-200 font-bold">{points}</strong> / {factorInfo.max} pts
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full ${barColorClass} transition-all duration-300 rounded-full`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">{factorInfo.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PriorityBreakdown;
