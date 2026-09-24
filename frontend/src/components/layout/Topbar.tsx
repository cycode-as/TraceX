import React from 'react';
import { Search, Bell, User } from 'lucide-react';

const Topbar: React.FC = () => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
      {/* Search Bar */}
      <div className="relative w-96">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search entities, events, hashes, or IPs..."
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-950 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
        />
      </div>

      {/* Right Actions & Status Indicator */}
      <div className="flex items-center gap-4">
        {/* LIVE Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 tracking-wider">LIVE</span>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:flex flex-col text-xs">
              <span className="text-slate-200 font-medium">SOC Analyst</span>
              <span className="text-slate-500">Level 2</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
