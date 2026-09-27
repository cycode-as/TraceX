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
import ConfidenceCard, { computeConfidenceScore } from '../components/ConfidenceCard';
import AuditTrail from '../components/incidents/AuditTrail';
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

  const confidenceScore = computeConfidenceScore(graphData);
  const confidencePercent = Math.round(confidenceScore * 100);

  if (isIncidentLoading) {
    return (
      <div className="p-5 max-w-7xl mx-auto space-y-4 font-code-sm animate-pulse">
        <div className="h-6 w-36 rounded-md bg-surface-container-high" />
        <div className="h-20 rounded-md border border-outline-variant bg-surface-container" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-96 rounded-md bg-surface-container" />
          <div className="lg:col-span-2 h-96 rounded-md bg-surface-container" />
        </div>
      </div>
    );
  }

  if (incidentError || !incident) {
    return (
      <div className="p-6 max-w-xl mx-auto font-code-sm space-y-4 text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="p-6 rounded-md space-y-3 bg-surface-container border border-error/40 text-error">
          <AlertCircle className="w-10 h-10 text-error mx-auto" />
          <h2 className="font-headline-sm text-on-surface">Incident Not Found</h2>
          <p className="font-body-sm text-on-surface-variant">{incidentError?.message || `No incident details for ID ${id}`}</p>
          <button onClick={() => refetch()} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const primaryUser = incident.primary_user || incident.user_id || 'USR-007';

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto font-body-md text-on-surface">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between font-code-sm text-on-surface-variant">
        <Link to="/" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <span>Incident ID: <strong className="text-primary">{incident.incident_id}</strong></span>
      </div>

      {/* Header Banner */}
      <div className="rounded-md p-5 space-y-3 font-code-sm bg-surface-container border border-outline-variant">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-headline-md text-primary">{incident.incident_id}</span>
              <StateBadge status={incident.status} size="md" />
              <span className="font-code-sm flex items-center gap-1 px-2 py-0.5 rounded-sm border bg-surface-container-lowest border-outline-variant text-on-surface">
                <User className="w-3.5 h-3.5 text-on-surface-variant" />
                Primary User: <strong className="text-on-surface">{primaryUser}</strong>
              </span>
              <span className="font-code-sm flex items-center gap-1 px-2 py-0.5 rounded-sm border bg-surface-container-lowest border-outline-variant text-on-surface-variant">
                <Clock className="w-3.5 h-3.5 text-on-surface-variant" />
                Time Window: <strong className="text-on-surface">{getTimeWindow()}</strong>
              </span>
            </div>
            <h1 className="font-headline-lg text-on-surface">{incident.title}</h1>
          </div>

          {/* Dual Score Metrics: Priority (Impact) vs Confidence (Certainty) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Priority Metric Badge */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-surface-container-lowest border border-outline-variant">
              <div className="text-center px-2">
                <span className="text-xl font-extrabold leading-none text-error">{incident.priority}</span>
                <span className="font-label-sm block text-on-surface-variant mt-0.5">PRIORITY</span>
              </div>
              <div className="w-1 h-7 rounded-sm bg-error" />
            </div>

            {/* Confidence Metric Badge */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-surface-container-lowest border border-primary/40">
              <div className="text-center px-2">
                <span className="text-xl font-extrabold leading-none text-primary">{confidencePercent}%</span>
                <span className="font-label-sm block text-primary mt-0.5">CONFIDENCE</span>
              </div>
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* "WHAT CHANGED?" Banner */}
      <WhatChangedBanner diffs={diffs} />

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="p-3 rounded-md font-code-sm flex justify-between items-center bg-secondary-container/20 border border-secondary/40 text-secondary">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Three-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Vertical Timeline (3 cols) */}
        <div className="lg:col-span-3 rounded-md p-4 space-y-3 bg-surface-container border border-outline-variant">
          <div className="flex items-center justify-between pb-2.5 font-code-sm border-b border-outline-variant">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-on-surface">
              <Clock className="w-3.5 h-3.5 text-primary" />
              EVENT TIMELINE
            </div>
            <span className="font-code-sm text-on-surface-variant">{timeline.length} events</span>
          </div>
          <Timeline events={timeline} />
        </div>

        {/* Center Column: React Flow Graph (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <IncidentGraph graphData={graphData} loading={isGraphLoading} />
        </div>

        {/* Right Column: Tabbed Panels (4 cols) */}
        <div className="lg:col-span-4 space-y-3 font-code-sm">
          {/* Tab Selection Bar */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-md bg-surface-container-lowest border border-outline-variant font-code-sm">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-1.5 rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'evidence'
                  ? 'bg-surface-container-high text-primary border border-primary/40'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <FileText className="w-3 h-3" />
              Evidence
            </button>

            <button
              onClick={() => setActiveTab('priority')}
              className={`py-1.5 rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'priority'
                  ? 'bg-surface-container-high text-primary border border-primary/40'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Zap className="w-3 h-3" />
              Priority
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`py-1.5 rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'audit'
                  ? 'bg-surface-container-high text-primary border border-primary/40'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <History className="w-3 h-3" />
              Audit
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`py-1.5 rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'ai'
                  ? 'bg-surface-container-high text-primary border border-primary/40'
                  : 'text-on-surface-variant hover:text-on-surface'
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
              <AuditTrail entries={auditLogs} loading={isAuditLoading} incidentId={id} />
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
