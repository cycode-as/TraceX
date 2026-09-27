import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, FileText, Zap, History, Bot, AlertCircle, ShieldCheck } from 'lucide-react';
import { useIncident, useIncidentTimeline, useIncidentGraph, useIncidentEvidence, useIncidentAudit, useIncidentExplanation, usePerformAction } from '../hooks/useIncident';
import { useSimulation } from '../hooks/useSimulation';
import StateBadge from '../components/StateBadge';
import WhatChangedBanner from '../components/WhatChangedBanner';
import Timeline from '../components/Timeline';
import IncidentGraph from '../components/IncidentGraph';
import EvidencePanel from '../components/EvidencePanel';
import PriorityBreakdown from '../components/PriorityBreakdown';
import ConfidenceCard from '../components/ConfidenceCard';
import AuditPanel from '../components/AuditPanel';
import AIExplanation from '../components/AIExplanation';
import ActionBar from '../components/ActionBar';
import type { AnalystActionType, DismissalReason } from '../types/incident';

export const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'evidence' | 'priority' | 'audit' | 'ai'>('evidence');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const { data: incident, isLoading: isIncidentLoading, error: incidentError, refetch } = useIncident(id);
  const { data: timeline = [] } = useIncidentTimeline(id);
  const { data: graphData, isLoading: isGraphLoading } = useIncidentGraph(id);
  const { data: evidenceList = [], isLoading: isEvidenceLoading } = useIncidentEvidence(id);
  const { data: auditLogs = [], isLoading: isAuditLoading } = useIncidentAudit(id);
  const { data: aiExplanation, isLoading: isAiLoading } = useIncidentExplanation(id);
  const { mutateAsync: performAction, isPending: isActionPending } = usePerformAction(id);
  const { diffs } = useSimulation();

  const handleAnalystAction = async (action: AnalystActionType, reason?: DismissalReason) => {
    try {
      setActionFeedback(null);
      await performAction({ action, reason });
      setActionFeedback(`Analyst action '${action}' recorded successfully.`);
    } catch (err: unknown) {
      setActionFeedback(err instanceof Error ? err.message : 'Action execution failed');
    }
  };

  const getTimeWindow = () => {
    if (!timeline.length) return 'N/A';
    try {
      const first = new Date(timeline[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const last = new Date(timeline[timeline.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${first} — ${last}`;
    } catch {
      return 'N/A';
    }
  };

  if (isIncidentLoading) {
    return (
      <div className="p-5 max-w-7xl mx-auto space-y-4 font-mono animate-pulse">
        <div className="h-6 w-36 bg-[#0F1420] rounded" />
        <div className="h-20 bg-[#0F1420] rounded-md border border-[#1E2530]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-96 bg-[#0F1420] rounded-md" />
          <div className="lg:col-span-2 h-96 bg-[#0F1420] rounded-md" />
        </div>
      </div>
    );
  }

  if (incidentError || !incident) {
    return (
      <div className="p-6 max-w-xl mx-auto font-mono space-y-4 text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="p-6 bg-[#0F1420] border border-red-500/30 rounded-md space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Incident Not Found</h2>
          <p className="text-xs text-slate-400">{incidentError?.message || `No incident details for ID ${id}`}</p>
          <button onClick={() => refetch()} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const primaryUser = incident.primary_user || incident.user_id || 'USR-007';

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto font-sans">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between font-mono text-xs text-slate-400">
        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <span>Incident ID: <strong className="text-cyan-400">{incident.incident_id}</strong></span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#0F1420] border border-[#1E2530] rounded-md p-5 space-y-3 font-mono shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg font-extrabold text-cyan-400">{incident.incident_id}</span>
              <StateBadge status={incident.status} size="md" />
              <span className="text-xs text-slate-300 flex items-center gap-1 bg-[#0B0E14] px-2 py-0.5 rounded border border-[#1E2530]">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Primary User: <strong className="text-white">{primaryUser}</strong>
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 bg-[#0B0E14] px-2 py-0.5 rounded border border-[#1E2530]">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Time Window: <strong className="text-slate-200">{getTimeWindow()}</strong>
              </span>
            </div>
            <h1 className="text-lg font-bold text-white font-sans">{incident.title}</h1>
          </div>

          {/* Dual Score Metrics: Priority (Impact) vs Confidence (Certainty) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Priority Metric Badge */}
            <div className="flex items-center gap-2 p-2 bg-[#0B0E14] border border-[#1E2530] rounded-md">
              <div className="text-center px-2">
                <span className="text-xl font-black text-red-400 leading-none">{incident.priority}</span>
                <span className="text-[8px] text-slate-400 block uppercase font-bold mt-0.5">PRIORITY</span>
              </div>
              <div className="w-1 h-7 bg-red-500 rounded-full" />
            </div>

            {/* Confidence Metric Badge (Distinct Vocabulary & Colors) */}
            <div className="flex items-center gap-2 p-2 bg-[#0B0E14] border border-cyan-500/30 rounded-md">
              <div className="text-center px-2">
                <span className="text-xl font-black text-cyan-400 leading-none">88%</span>
                <span className="text-[8px] text-cyan-300 block uppercase font-bold mt-0.5">CONFIDENCE</span>
              </div>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      {/* "WHAT CHANGED?" Banner */}
      <WhatChangedBanner diffs={diffs} />

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-md text-xs font-mono flex justify-between items-center">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Three-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Vertical Timeline (3 cols) */}
        <div className="lg:col-span-3 bg-[#0F1420] border border-[#1E2530] rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1E2530] pb-2.5 font-mono">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold uppercase">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              EVENT TIMELINE
            </div>
            <span className="text-[10px] text-slate-400">{timeline.length} events</span>
          </div>
          <Timeline events={timeline} />
        </div>

        {/* Center Column: React Flow Graph (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <IncidentGraph graphData={graphData} loading={isGraphLoading} />
        </div>

        {/* Right Column: Tabbed Panels (4 cols) */}
        <div className="lg:col-span-4 space-y-3 font-mono">
          {/* Tab Selection Bar */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#0B0E14] border border-[#1E2530] rounded-md text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'evidence'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              Evidence
            </button>

            <button
              onClick={() => setActiveTab('priority')}
              className={`py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'priority'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              Priority
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'audit'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3 h-3" />
              Audit
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'ai'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3 h-3" />
              AI
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div>
            {activeTab === 'evidence' && (
              <EvidencePanel evidenceList={evidenceList} loading={isEvidenceLoading} />
            )}

            {activeTab === 'priority' && (
              <div className="space-y-4">
                <ConfidenceCard graphData={graphData} />
                <PriorityBreakdown score={incident.priority} />
              </div>
            )}

            {activeTab === 'audit' && (
              <AuditPanel auditLogs={auditLogs} loading={isAuditLoading} />
            )}

            {activeTab === 'ai' && (
              <AIExplanation explanation={aiExplanation} loading={isAiLoading} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <ActionBar
        onAction={handleAnalystAction}
        isPending={isActionPending}
      />
    </div>
  );
};

export default IncidentDetail;
