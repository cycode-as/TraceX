import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Activity, AlertTriangle, GitFork, ShieldAlert, Zap, ChevronRight } from 'lucide-react';
import type { PipelineStage } from '../hooks/useSimulation';

interface PipelineStripProps {
  activeStage: PipelineStage;
  className?: string;
}

const STAGES: { id: PipelineStage; label: string; icon: React.ElementType }[] = [
  { id: 'Normalization', label: 'Normalization', icon: Layers },
  { id: 'Baseline',      label: 'Baseline',      icon: Activity },
  { id: 'Anomaly',       label: 'Anomaly',        icon: AlertTriangle },
  { id: 'Correlation',   label: 'Correlation',    icon: GitFork },
  { id: 'Incident',      label: 'Incident',       icon: ShieldAlert },
  { id: 'Priority',      label: 'Priority',       icon: Zap },
];

export const PipelineStrip: React.FC<PipelineStripProps> = ({ activeStage, className = '' }) => {
  const activeIndex = STAGES.findIndex((s) => s.id === activeStage);

  return (
    <div
      className={`rounded-xl p-3 font-mono ${className}`}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(30, 41, 59, 0.8)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-3"
        style={{ color: 'var(--color-muted)' }}
      >
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#F7931A' }}>
          <Layers className="w-3.5 h-3.5" />
          INTELLIGENCE PIPELINE STAGE
        </span>
        <span style={{ color: 'var(--color-muted)' }}>
          Active:{' '}
          <strong style={{ color: '#F7931A' }}>{activeStage}</strong>
        </span>
      </div>

      {/* ── Stage Nodes ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStage;
          const isPassed = idx <= (activeIndex === -1 ? STAGES.length - 1 : activeIndex);

          return (
            <div key={stage.id} className="relative flex items-center">
              <motion.div
                animate={{
                  scale: isActive ? 1.04 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
                style={
                  isActive
                    ? {
                        background:  'rgba(247, 147, 26, 0.12)',
                        border:      '1px solid rgba(247, 147, 26, 0.45)',
                        color:       '#F7931A',
                        boxShadow:   '0 0 16px -4px rgba(247, 147, 26, 0.35)',
                      }
                    : isPassed
                    ? {
                        background:  'rgba(30, 41, 59, 0.4)',
                        border:      '1px solid rgba(30, 41, 59, 0.8)',
                        color:       '#CBD5E1',
                      }
                    : {
                        background:  'rgba(3, 3, 4, 0.5)',
                        border:      '1px solid rgba(30, 41, 59, 0.4)',
                        color:       'var(--color-muted)',
                      }
                }
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'animate-pulse' : ''}`}
                  style={{
                    color: isActive ? '#F7931A' : isPassed ? '#CBD5E1' : 'var(--color-muted)',
                  }}
                />
                <span className="truncate">{stage.label}</span>
              </motion.div>

              {idx < STAGES.length - 1 && (
                <ChevronRight
                  className="w-3.5 h-3.5 absolute -right-2 z-10 hidden md:block"
                  style={{ color: isPassed ? 'rgba(247, 147, 26, 0.4)' : 'rgba(30, 41, 59, 0.6)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineStrip;
