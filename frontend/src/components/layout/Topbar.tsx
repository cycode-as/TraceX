import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  Shield,
  Activity,
  RefreshCw,
  LayoutDashboard,
  AlertTriangle,
  PlaySquare,
  FileText,
} from 'lucide-react';
import { useSimulation } from '../../hooks/useSimulation';
import { useEvents } from '../../hooks/useEvents';

const navItems = [
  { name: 'Dashboard',        path: '/',           icon: LayoutDashboard },
  { name: 'Incidents Queue',  path: '/incidents',  icon: AlertTriangle   },
  { name: 'Telemetry Events', path: '/events',     icon: Activity        },
  { name: 'Simulation Mode',  path: '/simulation', icon: PlaySquare      },
  { name: 'Audit Logs',       path: '/audit',      icon: FileText        },
];

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

      {/* ── Row 2: Centered Horizontal Navigation & Status ── */}
      <div className="px-5 h-11 flex items-center justify-between bg-surface-container-lowest relative">
        <div className="w-32 hidden md:block" />

        {/* Centered Navigation Links */}
        <nav className="flex items-center gap-1 overflow-x-auto justify-center mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1 rounded-md font-body-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-surface-container-high border border-primary text-primary font-semibold'
                      : 'text-on-surface-variant border border-transparent hover:bg-surface-container-low hover:text-on-surface'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

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
