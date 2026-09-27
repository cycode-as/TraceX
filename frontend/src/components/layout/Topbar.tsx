import React from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  Shield,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useSimulation } from '../../hooks/useSimulation';
import { useEvents } from '../../hooks/useEvents';
import Dock from './Dock';

export const Topbar: React.FC = () => {
  const { nextEvent, resetSimulation, isNextLoading, isResetLoading } = useSimulation();
  const { data: events = [] } = useEvents();

  return (
    <header className="sticky top-0 z-30 flex flex-col shrink-0 font-code-sm bg-surface-container border-b border-outline-variant">
      {/* ── Row 1: Brand Header & Control Bar ── */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-outline-variant/60">
        {/* Brand Header */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-surface-container-high border border-outline-variant group-hover:border-primary transition-colors">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-headline-sm text-primary">
              TraceX
            </div>
            <div className="font-body-sm text-on-surface-variant">
              Incident Intelligence System
            </div>
          </div>
        </Link>

        {/* Center: Controls */}
        <div className="flex items-center gap-3">
          {/* Live Event Counter */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md font-code-sm bg-surface-container-lowest border border-outline-variant text-on-surface-variant">
            <Activity className="w-3.5 h-3.5 text-secondary animate-pulse" />
            <span>Events:</span>
            <strong className="font-bold text-secondary">
              {events.length}
            </strong>
          </div>

          {/* Simulation Controls */}
          <div className="flex items-center gap-1.5 p-1 rounded-md bg-surface-container-lowest border border-outline-variant">
            {/* Next Event Button */}
            <button
              onClick={() => nextEvent()}
              disabled={isNextLoading}
              title="Process next simulated telemetry event"
              className="btn-primary"
            >
              {isNextLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              Next Event
            </button>

            {/* Reset Button */}
            <button
              onClick={() => resetSimulation()}
              disabled={isResetLoading}
              title="Reset active simulation scenario"
              className="btn-ghost"
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

        {/* Right: Analyst Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-code-sm bg-surface-container-lowest border border-outline-variant text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>
            ANALYST: <strong className="text-primary font-bold">SOC-LEAD</strong>
          </span>
        </div>
      </div>

      {/* ── Row 2: Centered Animated Dock Navigation ── */}
      <div className="px-5 py-2.5 flex items-center justify-between bg-surface-container-lowest/90 relative min-h-[72px]">
        {/* Left Spacer for symmetry */}
        <div className="w-32 hidden md:block" />

        {/* Centered Animated Dock Navbar */}
        <div className="mx-auto flex justify-center py-1">
          <Dock />
        </div>

        {/* Engine Status Indicator on far right */}
        <div className="hidden sm:flex items-center gap-1.5 font-code-sm text-secondary font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          ENGINE ONLINE
        </div>
      </div>
    </header>
  );
};

export default Topbar;
