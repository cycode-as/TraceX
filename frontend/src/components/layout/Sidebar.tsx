import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Activity,
  PlaySquare,
  FileText,
  Shield,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',         path: '/',           icon: LayoutDashboard },
  { name: 'Incidents Queue',   path: '/incidents',  icon: AlertTriangle },
  { name: 'Telemetry Events',  path: '/events',     icon: Activity },
  { name: 'Simulation Mode',   path: '/simulation', icon: PlaySquare },
  { name: 'Audit Logs',        path: '/audit',      icon: FileText },
];

export const Sidebar: React.FC = () => {
  return (
    <aside
      className="w-56 flex flex-col h-screen sticky top-0 shrink-0 font-mono"
      style={{
        backgroundColor: '#121821',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
      }}
    >
      {/* ── Brand Header ── */}
      <Link
        to="/"
        className="h-14 flex items-center px-4 gap-3 transition-all duration-200 group"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        {/* Icon with Electric Blue glow */}
        <div
          className="p-1.5 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105"
          style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            boxShadow: '0 0 14px rgba(59, 130, 246, 0.25)',
          }}
        >
          <Shield className="w-4 h-4" style={{ color: '#3B82F6' }} />
        </div>

        {/* Brand text */}
        <div className="flex flex-col">
          <span
            className="font-bold tracking-widest text-sm leading-none font-heading"
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
            className="text-[9px] tracking-wider mt-1 font-mono"
            style={{ color: '#9AA4B2' }}
          >
            SOC DASHBOARD
          </span>
        </div>
      </Link>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2.5 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive ? 'active-nav' : 'inactive-nav'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: '#1A2230',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      color: '#60A5FA',
                      boxShadow: '0 0 12px rgba(59, 130, 246, 0.15)',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: '#9AA4B2',
                    }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors duration-200"
                    style={{ color: isActive ? '#3B82F6' : '#9AA4B2' }}
                  />
                  <span>{item.name}</span>
                  {/* Active indicator bar */}
                  {isActive && (
                    <span
                      className="ml-auto w-1 h-4 rounded-full"
                      style={{
                        background: '#3B82F6',
                        boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer Status ── */}
      <div
        className="p-3 text-[10px] font-mono"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        {/* Engine Status */}
        <div className="flex justify-between items-center">
          <span style={{ color: '#9AA4B2' }}>Engine Status:</span>
          <span className="flex items-center gap-1.5 font-bold" style={{ color: '#10B981' }}>
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }}
            />
            ONLINE
          </span>
        </div>
        <div className="mt-1" style={{ color: 'rgba(154, 164, 178, 0.5)' }}>
          FastAPI backend @ :8000
        </div>

        {/* Thin Electric Blue accent line at bottom */}
        <div
          className="mt-3 h-px rounded-full"
          style={{ background: 'linear-gradient(to right, rgba(37,99,235,0.6), rgba(59,130,246,0.3), transparent)' }}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
