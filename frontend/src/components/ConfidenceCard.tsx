import React from 'react';
import { ShieldCheck, HelpCircle, CheckCircle2 } from 'lucide-react';
import type { GraphData } from '../types/graph';

/**
 * Vocabulary for System Confidence (distinct from Priority labels: LOW/MEDIUM/HIGH/CRITICAL)
 */
export type ConfidenceLabel = 'STRONG' | 'MODERATE' | 'WEAK' | 'TENTATIVE';

interface ConfidenceCardProps {
  graphData?: GraphData;
  explicitScore?: number; // Optional direct score (0.0 to 1.0 or 0 to 100)
  className?: string;
}

/**
 * ASSUMPTION & BACKEND CONTRACT NOTE:
 * The current backend API contracts (CONTRACTS.md / API_CONTRACT.md) do not explicitly return an incident-level `confidence_score`.
 * As a frontend proxy, this component averages the correlation strength values across all edges in the incident's graph data.
 * 
 * TODO / BACKEND RECOMMENDATION:
 * Recommend adding explicit `confidence_score` (0.00 - 1.00) and `confidence_label` ('STRONG' | 'MODERATE' | 'WEAK' | 'TENTATIVE')
 * to the `GET /api/incidents/{id}` or `GET /api/incidents/{id}/priority` endpoints.
 */
export function computeConfidenceScore(graphData?: GraphData, explicitScore?: number): number {
  if (typeof explicitScore === 'number') {
    return explicitScore > 1 ? explicitScore / 100 : explicitScore;
  }

  if (graphData?.edges && graphData.edges.length > 0) {
    const scores = graphData.edges
      .map((e) => {
        const rawScore = e.data?.score;
        if (typeof rawScore === 'number') return rawScore > 1 ? rawScore / 100 : rawScore;
        if (typeof rawScore === 'string') {
          const parsed = parseFloat(rawScore);
          return isNaN(parsed) ? null : parsed > 1 ? parsed / 100 : parsed;
        }
        return null;
      })
      .filter((s): s is number => s !== null);

    if (scores.length > 0) {
      const sum = scores.reduce((acc, curr) => acc + curr, 0);
      return sum / scores.length;
    }
  }

  // Default fallback proxy (0.88 / 88% strong correlation)
  return 0.88;
}

export const ConfidenceCard: React.FC<ConfidenceCardProps> = ({
  graphData,
  explicitScore,
  className = '',
}) => {
  // Compute proxy confidence score from graph edge scores if explicitScore is not provided
  const computedScore = React.useMemo(() => {
    return computeConfidenceScore(graphData, explicitScore);
  }, [graphData, explicitScore]);

  const percentage = Math.round(computedScore * 100);

  const getConfidenceDetails = (score: number): { label: ConfidenceLabel; color: string; bg: string; border: string } => {
    if (score >= 0.8) {
      return {
        label: 'STRONG',
        color: '#38BDF8', // Cyan-400
        bg: 'rgba(56, 189, 248, 0.1)',
        border: 'rgba(56, 189, 248, 0.3)',
      };
    }
    if (score >= 0.6) {
      return {
        label: 'MODERATE',
        color: '#A78BFA', // Purple-400
        bg: 'rgba(167, 139, 250, 0.1)',
        border: 'rgba(167, 139, 250, 0.3)',
      };
    }
    if (score >= 0.4) {
      return {
        label: 'WEAK',
        color: '#FBBF24', // Amber-400
        bg: 'rgba(251, 191, 36, 0.1)',
        border: 'rgba(251, 191, 36, 0.3)',
      };
    }
    return {
      label: 'TENTATIVE',
      color: '#94A3B8', // Slate-400
      bg: 'rgba(148, 163, 184, 0.1)',
      border: 'rgba(148, 163, 184, 0.3)',
    };
  };

  const style = getConfidenceDetails(computedScore);

  return (
    <div
      className={`rounded-xl p-4 space-y-3 font-mono ${className}`}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 0 15px rgba(56, 189, 248, 0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-200">
            SYSTEM CORRELATION CONFIDENCE
          </h3>
        </div>
        <span
          className="px-2.5 py-0.5 rounded text-xs font-extrabold border tracking-wide"
          style={{
            color: style.color,
            background: style.bg,
            borderColor: style.border,
          }}
        >
          {style.label} CONFIDENCE ({percentage}%)
        </span>
      </div>

      {/* Body Content */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
        <div
          className="text-center p-2.5 rounded-lg min-w-[85px] border"
          style={{
            borderColor: style.border,
            background: 'rgba(15, 20, 32, 0.8)',
          }}
        >
          <div className="text-2xl font-black text-cyan-400 leading-none">
            {computedScore.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-400 uppercase font-semibold mt-1">
            AVG STRENGTH
          </div>
        </div>

        <div className="space-y-1 text-xs font-sans">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-300 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Relationship Validity Metric</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Confidence measures the system's statistical certainty that event correlations are legitimate and not coincidental.
          </p>
        </div>
      </div>

      {/* Difference Explanation Disclaimer */}
      <div className="p-2.5 rounded-md bg-cyan-950/20 border border-cyan-500/20 text-[11px] font-sans text-cyan-200/90 flex items-start gap-2">
        <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5 font-mono" />
        <div>
          <strong className="font-mono text-cyan-300 font-bold">Confidence vs. Priority:</strong> Priority measures <em className="not-italic text-white">operational urgency & asset impact</em> (0–100 score). Confidence measures <em className="not-italic text-white">correlation accuracy & evidence certainty</em> ({percentage}%). An incident can be <strong>High Priority</strong> (severe asset risk) even with <strong>Moderate Confidence</strong>.
        </div>
      </div>
    </div>
  );
};

export default ConfidenceCard;
