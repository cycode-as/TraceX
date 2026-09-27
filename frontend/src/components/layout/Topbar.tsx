import React from 'react';
import { Play, RotateCcw, Shield, Activity, RefreshCw } from 'lucide-react';
import { useSimulation } from '../../hooks/useSimulation';
import { useEvents } from '../../hooks/useEvents';

export const Topbar: React.FC = () => {
  const { nextEvent, resetSimulation, isNextLoading, isResetLoading } = useSimulation();
  const { data: events = [] } = useEvents();

  return (
    <header
      className="h-14 px-5 flex items-center justify-between shrink-0 sticky top-0 z-30 font-mono"
      style={{
        backgroundColor: 'rgba(18, 24, 33, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.25)',
          }}
        >
          <Shield className="w-4 h-4" style={{ color: '#3B82F6' }} />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-extrabold tracking-wider font-heading">
            <span
              style={{
                background: 'linear-gradient(to right, #3B82F6, #60A5FA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              TraceX
            </span>
            <span
              className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60A5FA',
              }}
            >
              SOC v2.4
            </span>
          </div>
          <div className="text-[10px] font-body" style={{ color: '#9AA4B2' }}>
            Incident Intelligence System
          </div>
        </div>
      </div>

      {/* ── Center: Controls ── */}
      <div className="flex items-center gap-3">
        {/* Live Event Counter */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: '#0B0F14',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: '#10B981' }} />
          <span style={{ color: '#9AA4B2' }}>Events:</span>
          <strong className="font-bold" style={{ color: '#10B981' }}>
            {events.length}
          </strong>
        </div>

        {/* Simulation Controls */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-lg"
          style={{
            background: '#0B0F14',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          {/* Next Event — Primary Electric Blue button */}
          <button
            onClick={() => nextEvent()}
            disabled={isNextLoading}
            title="Process next simulated telemetry event"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 disabled:opacity-50 cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #2563EB, #3B82F6)',
              color: 'white',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 16px -4px rgba(37, 99, 235, 0.5)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px -4px rgba(59, 130, 246, 0.65)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px -4px rgba(37, 99, 235, 0.5)';
            }}
          >
            {isNextLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            Next Event
          </button>

          {/* Reset — Ghost button */}
          <button
            onClick={() => resetSimulation()}
            disabled={isResetLoading}
            title="Reset active simulation scenario"
            className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isResetLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            Reset
          </button>
        </div>
      </div>

      {/* ── Right: Analyst Badge ── */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono"
        style={{
          background: '#0B0F14',
          border: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: '#10B981',
            boxShadow: '0 0 6px #10B981',
          }}
        />
        <span style={{ color: '#CBD5E1' }}>
          ANALYST:{' '}
          <strong style={{ color: '#60A5FA' }}>SOC-LEAD</strong>
        </span>
      </div>
    </header>
  );
};

export default Topbar;
