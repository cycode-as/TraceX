import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap, ShieldAlert } from 'lucide-react';
import type { Priority, PriorityFactors } from '../types/graph';

interface PriorityBreakdownProps {
  priority?: Priority;
  score?: number;
  className?: string;
}

const DEFAULT_FACTORS: PriorityFactors = {
  behavioral_anomaly:    24,
  correlation_strength:  18,
  asset_criticality:     17,
  incident_progression:  14,
  evidence_strength:     13,
};

const FACTOR_CONFIG: { key: keyof PriorityFactors; name: string; color: string; desc: string }[] = [
  { key: 'behavioral_anomaly',   name: 'Behavioral Anomaly',   color: '#EF4444', desc: 'Deviations from user baseline & location anomalies' },
  { key: 'correlation_strength', name: 'Correlation Strength', color: '#F59E0B', desc: 'Temporal and session alignment across telemetry' },
  { key: 'asset_criticality',    name: 'Asset Criticality',    color: '#FB923C', desc: 'Sensitivity of target databases, vaults, or assets' },
  { key: 'incident_progression', name: 'Incident Progression', color: '#8B5CF6', desc: 'Multi-stage progression and privilege escalation' },
  { key: 'evidence_strength',    name: 'Evidence Strength',    color: '#10B981', desc: 'Verification confidence & multi-source evidence' },
];

export const PriorityBreakdown: React.FC<PriorityBreakdownProps> = ({ priority, score: propScore, className = '' }) => {
  const currentScore = priority?.score ?? propScore ?? 86;
  const factors = priority?.factors ?? DEFAULT_FACTORS;

  const chartData = FACTOR_CONFIG.map((f) => ({
    name:  f.name,
    score: factors[f.key] ?? 0,
    color: f.color,
  }));

  const labelText =
    currentScore >= 70 ? 'HIGH' :
    currentScore >= 40 ? 'MEDIUM' : 'LOW';

  const labelStyle =
    currentScore >= 70
      ? { color: '#F87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
      : currentScore >= 40
      ? { color: '#FCD34D', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
      : { color: '#60A5FA', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' };

  return (
    <div
      className={`rounded-xl p-4 space-y-4 font-mono ${className}`}
      style={{
        background: 'var(--color-surface)',
        border:     '1px solid rgba(30, 41, 59, 0.8)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between pb-2.5"
        style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.7)' }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: '#60A5FA' }} />
          <h3 className="text-xs uppercase font-bold tracking-wider text-white">
            INVESTIGATION PRIORITY BREAKDOWN
          </h3>
        </div>
        <span
          className="px-2 py-0.5 rounded text-xs font-bold border"
          style={{
            color:       labelStyle.color,
            background:  labelStyle.bg,
            borderColor: labelStyle.border,
          }}
        >
          {labelText} PRIORITY ({currentScore}/100)
        </span>
      </div>

      {/* ── Score Hero ── */}
      <div
        className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-lg"
        style={{
          background: 'rgba(3, 3, 4, 0.6)',
          border:     '1px solid rgba(30, 41, 59, 0.7)',
        }}
      >
        {/* Score Circle */}
        <div
          className="text-center p-3 rounded-lg min-w-[90px]"
          style={{
            background: 'var(--color-surface)',
            border:     '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow:  '0 0 20px -6px rgba(59, 130, 246, 0.25)',
          }}
        >
          <div
            className="text-3xl font-extrabold leading-none"
            style={{
              background:            currentScore >= 70 ? 'linear-gradient(to bottom, #F87171, #EF4444)' : 'linear-gradient(to bottom, #60A5FA, #2563EB)',
              WebkitBackgroundClip:  'text',
              WebkitTextFillColor:   'transparent',
              backgroundClip:        'text',
            }}
          >
            {currentScore}
          </div>
          <div className="text-[10px] uppercase mt-1" style={{ color: 'var(--color-muted)' }}>
            TOTAL SCORE
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1 text-xs font-sans">
          <span className="text-slate-200 font-semibold flex items-center gap-1.5 font-mono text-xs">
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
            Weighted Intelligence Score
          </span>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Priority represents human analyst triage order based on structured telemetry signals.
            It is NOT attack probability.
          </p>
        </div>
      </div>

      {/* ── Recharts Bar Chart ── */}
      <div className="space-y-1">
        <div
          className="text-[11px] uppercase font-semibold mb-2"
          style={{ color: 'var(--color-muted)' }}
        >
          FACTOR CONTRIBUTION CHART
        </div>
        <div
          className="h-44 w-full p-2 rounded-lg"
          style={{
            background: 'rgba(3, 3, 4, 0.6)',
            border:     '1px solid rgba(30, 41, 59, 0.7)',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <XAxis
                type="number"
                domain={[0, 30]}
                stroke="rgba(30, 41, 59, 0.8)"
                fontSize={10}
                tickLine={false}
                tick={{ fill: 'var(--color-muted)' }}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="rgba(30, 41, 59, 0.8)"
                fontSize={10}
                width={120}
                tickLine={false}
                tick={{ fill: '#94A3B8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor:     'rgba(59, 130, 246, 0.3)',
                  color:           '#E2E8F0',
                  fontSize:        '11px',
                  fontFamily:      'JetBrains Mono, monospace',
                  borderRadius:    '8px',
                }}
                formatter={(val) => [`${val} points`, 'Contribution']}
                cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Factor List ── */}
      <div
        className="space-y-2 pt-2"
        style={{ borderTop: '1px solid rgba(30, 41, 59, 0.7)' }}
      >
        <div
          className="text-[11px] uppercase font-semibold flex items-center justify-between"
          style={{ color: 'var(--color-muted)' }}
        >
          <span>FACTOR DETAILS</span>
          <span>SCORE CONTRIBUTION</span>
        </div>

        <div className="space-y-2">
          {FACTOR_CONFIG.map((f) => {
            const pts = factors[f.key] ?? 0;
            return (
              <div
                key={f.key}
                className="p-2.5 rounded-lg space-y-1 transition-all duration-200"
                style={{
                  background: 'rgba(3, 3, 4, 0.5)',
                  border:     '1px solid rgba(30, 41, 59, 0.6)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(30, 41, 59, 0.6)';
                }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: f.color, boxShadow: `0 0 6px ${f.color}60` }}
                    />
                    {f.name}
                  </span>
                  <span className="font-bold text-white">+{pts} pts</span>
                </div>
                <p className="text-[11px] font-sans" style={{ color: 'var(--color-muted)' }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PriorityBreakdown;
