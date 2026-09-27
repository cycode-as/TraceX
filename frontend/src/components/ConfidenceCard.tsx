import React from 'react';
import { ShieldCheck, HelpCircle, CheckCircle2 } from 'lucide-react';
import type { GraphData } from '../types/graph';

export type ConfidenceLabel = 'STRONG' | 'MODERATE' | 'WEAK' | 'TENTATIVE';

interface ConfidenceCardProps {
  graphData?: GraphData;
  explicitScore?: number;
  className?: string;
}

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

  return 0.88;
}

export const ConfidenceCard: React.FC<ConfidenceCardProps> = ({
  graphData,
  explicitScore,
  className = '',
}) => {
  const computedScore = React.useMemo(() => {
    return computeConfidenceScore(graphData, explicitScore);
  }, [graphData, explicitScore]);

  const percentage = Math.round(computedScore * 100);

  const getConfidenceDetails = (score: number): { label: ConfidenceLabel; color: string; bg: string; border: string } => {
    if (score >= 0.8) {
      return {
        label: 'STRONG',
        color: '#60A5FA',
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.3)',
      };
    }
    if (score >= 0.6) {
      return {
        label: 'MODERATE',
        color: '#4edea3',
        bg: 'rgba(78, 222, 163, 0.1)',
        border: 'rgba(78, 222, 163, 0.3)',
      };
    }
    if (score >= 0.4) {
      return {
        label: 'WEAK',
        color: '#FCD34D',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
      };
    }
    return {
      label: 'TENTATIVE',
      color: '#9AA4B2',
      bg: 'rgba(154, 164, 178, 0.1)',
      border: 'rgba(154, 164, 178, 0.3)',
    };
  };

  const style = getConfidenceDetails(computedScore);

  return (
    <div
      className={`rounded-xl p-4 space-y-3 font-mono ${className}`}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" style={{ color: '#60A5FA' }} />
          <h3 className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--color-text)' }}>
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
      <div
        className="flex flex-col sm:flex-row items-center gap-3.5 p-3 rounded-lg border"
        style={{
          background: 'var(--color-surface-container)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="text-center p-2.5 rounded-lg min-w-[85px] border"
          style={{
            borderColor: style.border,
            background: 'var(--color-void)',
          }}
        >
          <div className="text-2xl font-black leading-none" style={{ color: '#60A5FA' }}>
            {computedScore.toFixed(2)}
          </div>
          <div className="text-[9px] uppercase font-semibold mt-1" style={{ color: 'var(--color-muted)' }}>
            AVG STRENGTH
          </div>
        </div>

        <div className="space-y-1 text-xs font-sans">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold" style={{ color: '#60A5FA' }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
            <span>Relationship Validity Metric</span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Confidence measures the system's statistical certainty that event correlations are legitimate and not coincidental.
          </p>
        </div>
      </div>

      {/* Difference Explanation Disclaimer */}
      <div
        className="p-2.5 rounded-md border text-[11px] font-sans flex items-start gap-2"
        style={{
          background: 'var(--color-surface-container)',
          borderColor: 'rgba(59, 130, 246, 0.25)',
          color: 'var(--color-text)',
        }}
      >
        <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 font-mono" style={{ color: '#60A5FA' }} />
        <div>
          <strong className="font-mono font-bold" style={{ color: '#60A5FA' }}>Confidence vs. Priority:</strong> Priority measures <em className="not-italic text-white">operational urgency & asset impact</em> (0–100 score). Confidence measures <em className="not-italic text-white">correlation accuracy & evidence certainty</em> ({percentage}%). An incident can be <strong>High Priority</strong> (severe asset risk) even with <strong>Moderate Confidence</strong>.
        </div>
      </div>
    </div>
  );
};

export default ConfidenceCard;
