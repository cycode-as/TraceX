import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertCircle,
  Clock,
  User,
  Monitor,
  Database,
  Globe,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import {
  startSimulation,
  nextEvent,
  previousEvent,
  resetSimulation,
  getSimulationState,
} from '../services/simulation';
import type { SimulationState, SimulationScenario } from '../types/incident';
import type { NormalizedEvent } from '../types/event';
import WhatChanged from '../components/simulation/WhatChanged';

const SCENARIO_STEPS: Record<SimulationScenario, { type: string; label: string }[]> = {
  suspicious: [
    { type: 'login', label: 'Login' },
    { type: 'mfa_failure', label: 'MFA Failure' },
    { type: 'new_device', label: 'New Device' },
    { type: 'resource_access', label: 'Finance Access' },
    { type: 'privilege_change', label: 'Privilege Escalation' },
    { type: 'large_transfer', label: 'Large Data Transfer' },
  ],
  benign: [
    { type: 'login', label: 'Login' },
    { type: 'mfa_success', label: 'MFA Success' },
    { type: 'resource_access', label: 'Standard Resource Access' },
  ],
};

export const Simulation: React.FC = () => {
  const [currentState, setCurrentState] = useState<SimulationState | null>(null);
  const [previousState, setPreviousState] = useState<SimulationState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionPending, setActionPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSimulationState();
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to fetch simulation state');
      }
      setCurrentState(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error initializing simulation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await getSimulationState();
        if (!isMounted) return;
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'Failed to fetch simulation state');
        }
        setCurrentState(res.data);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error initializing simulation');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Scenario Change
  const handleScenarioChange = async (scenario: SimulationScenario) => {
    setIsPlaying(false);
    setActionPending(true);
    setError(null);
    try {
      const res = await startSimulation(scenario);
      if (res.success && res.data) {
        setPreviousState(currentState);
        setCurrentState(res.data);
      } else {
        throw new Error(res.error?.message || 'Failed to start scenario');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error changing scenario');
    } finally {
      setActionPending(false);
    }
  };

  // Handle Next Event
  const handleNext = useCallback(async () => {
    if (actionPending) return;
    setActionPending(true);
    setError(null);
    try {
      const res = await nextEvent();
      if (res.success && res.data) {
        setPreviousState(currentState);
        setCurrentState(res.data);
      } else {
        throw new Error(res.error?.message || 'Unable to process next event');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error advancing simulation');
      setIsPlaying(false);
    } finally {
      setActionPending(false);
    }
  }, [actionPending, currentState]);

  // Handle Previous Event
  const handlePrevious = async () => {
    if (actionPending) return;
    setIsPlaying(false);
    setActionPending(true);
    setError(null);
    try {
      const res = await previousEvent();
      if (res.success && res.data) {
        setPreviousState(currentState);
        setCurrentState(res.data);
      } else {
        throw new Error(res.error?.message || 'Unable to step backward');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error stepping backward');
    } finally {
      setActionPending(false);
    }
  };

  // Handle Reset Simulation
  const handleReset = async () => {
    setIsPlaying(false);
    setActionPending(true);
    setError(null);
    try {
      const res = await resetSimulation();
      if (res.success && res.data) {
        setPreviousState(null);
        setCurrentState(res.data);
      } else {
        throw new Error(res.error?.message || 'Failed to reset simulation');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error resetting simulation');
    } finally {
      setActionPending(false);
    }
  };

  // Derived state properties from server state
  const scenario = currentState?.scenario || 'suspicious';
  const processedEvents = currentState?.processed_events || [];
  const currentEvent = currentState?.current_event as NormalizedEvent | undefined;
  const currentStepIndex = Math.max(0, processedEvents.length - 1);
  const totalSteps = SCENARIO_STEPS[scenario]?.length || 6;

  const isAtStart = currentStepIndex <= 0;
  const isAtEnd = processedEvents.length >= totalSteps;

  // Auto Play Effect loop
  useEffect(() => {
    if (isPlaying) {
      autoPlayRef.current = setInterval(() => {
        if (!isAtEnd) {
          handleNext();
        } else {
          setIsPlaying(false);
        }
      }, 2500);
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPlaying, isAtEnd, handleNext]);

  const stepsList = SCENARIO_STEPS[scenario] || SCENARIO_STEPS.suspicious;

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded" />
        <div className="h-20 bg-slate-800/60 rounded-xl" />
        <div className="h-64 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Simulation Mode</h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Interactive Demo
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Synthetic enterprise telemetry — same production processing pipeline.
          </p>
        </div>

        {/* Scenario Selector Dropdown */}
        <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800 self-start md:self-auto">
          <Sliders className="w-4 h-4 text-purple-400 ml-2" />
          <span className="text-xs font-mono text-slate-400 font-medium">Scenario:</span>
          <select
            value={scenario}
            onChange={(e) => handleScenarioChange(e.target.value as SimulationScenario)}
            disabled={actionPending}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-700 cursor-pointer"
          >
            <option value="suspicious">Suspicious Account Activity & Exfiltration</option>
            <option value="benign">Benign Enterprise Activity</option>
          </select>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between gap-4 text-red-400 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Simulation action failed</p>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchState}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Progress Indicator Row */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-400" />
            Telemetry Sequence Progression
          </span>
          <span className="text-slate-200 font-bold">
            Step {processedEvents.length} of {totalSteps}
          </span>
        </div>

        {/* Horizontal Step Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stepsList.map((step, idx) => {
            const isProcessed = idx < processedEvents.length;
            const isCurrent = idx === currentStepIndex && processedEvents.length > 0;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between h-24 ${
                  isCurrent
                    ? 'bg-blue-950/80 border-blue-500 shadow-md shadow-blue-500/20 scale-[1.02]'
                    : isProcessed
                    ? 'bg-slate-950/90 border-slate-800 text-slate-300'
                    : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500 font-bold">
                    0{idx + 1}
                  </span>
                  {isProcessed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase block tracking-wider text-slate-400 truncate">
                    {step.type}
                  </span>
                  <span
                    className={`text-xs font-semibold block leading-tight truncate ${
                      isCurrent ? 'text-blue-300' : isProcessed ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={actionPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset
          </button>

          <button
            onClick={handlePrevious}
            disabled={actionPending || isAtStart}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Event
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={actionPending || isAtEnd}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 text-amber-400" />
                Pause Auto-Play
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400" />
                Auto-Play
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={actionPending || isAtEnd}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next Event</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Grid: Current Event Card & What Changed Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Event Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-slate-100">Current Processed Event</h2>
            </div>
            {currentEvent?.event_id && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {currentEvent.event_id}
              </span>
            )}
          </div>

          {currentEvent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
                  {currentEvent.event_type}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {currentEvent.timestamp}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {currentEvent.user_id && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block font-mono">User ID</span>
                      <span className="font-mono text-slate-200 font-semibold">{currentEvent.user_id}</span>
                    </div>
                  </div>
                )}

                {currentEvent.device_id && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-2.5">
                    <Monitor className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block font-mono">Device ID</span>
                      <span className="font-mono text-slate-200 font-semibold">{currentEvent.device_id}</span>
                    </div>
                  </div>
                )}

                {currentEvent.ip_address && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block font-mono">Location / IP</span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {currentEvent.location ? `${currentEvent.location} (${currentEvent.ip_address})` : currentEvent.ip_address}
                      </span>
                    </div>
                  </div>
                )}

                {currentEvent.resource && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block font-mono">Target Resource</span>
                      <span className="font-mono text-slate-200 font-semibold truncate block max-w-[160px]">
                        {currentEvent.resource}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Metadata JSON */}
              {currentEvent.metadata && Object.keys(currentEvent.metadata).length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                    Event Context Metadata
                  </span>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(currentEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No event currently processed. Click "Next Event" to step through simulation.
            </div>
          )}
        </div>

        {/* What Changed Diff Panel */}
        {currentState && (
          <WhatChanged previousState={previousState} currentState={currentState} />
        )}
      </div>
    </div>
  );
};

export default Simulation;
