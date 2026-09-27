import React from 'react';
import { Bot, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, Info, Database, Lightbulb } from 'lucide-react';
import type { ExplainResponse } from '../services/incidents';

interface AIExplanationProps {
  explanation?: ExplainResponse | null;
  loading?: boolean;
  className?: string;
}

/**
 * CLIENT-SIDE EPISTEMIC HEURISTIC NOTE:
 * The underlying `GET /api/incidents/{id}/explain` API payload does not structurally separate
 * facts from inferences at the JSON field level.
 * 
 * Heuristic mapping applied here:
 * - `supporting_evidence` & `mitigating_evidence`: Treated as FACT-heavy (direct telemetry observations).
 * - `why_connected`, `why_investigate`, and Executive Summary: Treated as INFERENCE-heavy (system reasoning & hypotheses).
 */
export const AIExplanation: React.FC<AIExplanationProps> = ({
  explanation,
  loading = false,
  className = '',
}) => {
  // Fallback data with hedged, non-declarative epistemic phrasing ("suggests", "is consistent with", "may indicate")
  const fallbackData: ExplainResponse = {
    summary:
      'Observed telemetry is consistent with a potential multi-stage account escalation: An initial MFA authentication anomaly was followed by an observed privilege shift to db_admin and a 650 MB database export.',
    why_connected: [
      'Shared active session SES-001 observed across USR-007 and DEV-882.',
      'Temporal proximity: Privilege shift was recorded 4 minutes after initial database query.',
      'Statistical correlation score (0.92) across geographic origin shifts.',
    ],
    supporting_evidence: [
      'Observed login from unrecognized IP address in Bucharest, Romania (EVT-1021).',
      'Observed privilege grant of db_admin role to USR-007 (EVT-1025).',
      'Recorded 650 MB database egress initiated from finance vault (EVT-1028).',
    ],
    mitigating_evidence: [
      'Observed completed hardware security key MFA 2 hours prior to anomaly window.',
      'Device DEV-882 is recorded in enterprise MDM system.',
    ],
    why_investigate:
      'Identified risk pattern warrants investigation due to indicators consistent with credential compromise and potential data exfiltration.',
    recommended_actions: [
      'Revoke db_admin role for user USR-007 pending analyst review.',
      'Quarantine endpoint device DEV-882 from corporate network.',
      'Invalidate session SES-001 and request credential reset.',
    ],
  };

  const data = explanation || fallbackData;
  const isFallback = !explanation;

  return (
    <div className={`bg-[#0F1420] border border-[#1E2530] rounded-md p-4 space-y-4 font-mono ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1E2530] pb-2.5">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">
            AI NARRATIVE EXPLANATION & TRIAGE ASSISTANT
          </h3>
        </div>
        {isFallback ? (
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
            DETERMINISTIC FALLBACK MODE
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI EXPLANATION LIVE
          </span>
        )}
      </div>

      {/* Epistemic Status Disclaimer Banner */}
      <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-md text-[11px] font-sans text-blue-200/90 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 font-mono" />
        <div>
          <strong className="font-mono text-cyan-300 uppercase font-bold text-[10px] block mb-0.5">
            EPISTEMIC DISCLAIMER:
          </strong>
          This explanation distinguishes observed facts from the system's inferred reasoning. Verify inferred conclusions before acting on them.
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 bg-[#0B0E14] rounded animate-pulse border border-[#1E2530]" />
          <div className="h-20 bg-[#0B0E14] rounded animate-pulse border border-[#1E2530]" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Executive Summary (INFERENCE HEAVY) */}
          <div className="p-3.5 bg-[#0B0E14] border border-cyan-500/30 rounded-md space-y-1.5">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                EXECUTIVE SUMMARY
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                INFERENCE (HYPOTHESIS)
              </span>
            </div>
            <p className="text-xs text-slate-200 font-sans leading-relaxed pt-1">{data.summary}</p>
          </div>

          {/* Why Connected (INFERENCE HEAVY) */}
          <div className="p-3.5 bg-[#0B0E14] border border-[#1E2530] rounded-md space-y-2">
            <div className="flex items-center justify-between border-b border-[#1E2530] pb-1.5">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                WHY EVENTS ARE CONNECTED
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                INFERRED REASONING
              </span>
            </div>
            <ul className="space-y-1 text-xs font-sans text-slate-300 pt-1">
              {data.why_connected.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Observed Telemetry Facts (FACT HEAVY) */}
          <div className="p-3.5 bg-[#0B0E14] border border-cyan-500/20 rounded-md space-y-2">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider font-mono">
                SUPPORTING TELEMETRY EVIDENCE
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                <Database className="w-3 h-3" />
                FACT (LOG DATA)
              </span>
            </div>
            <ul className="space-y-1 text-xs font-sans text-slate-300 pt-1">
              {data.supporting_evidence.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Why Investigate (INFERENCE HEAVY) */}
          <div className="p-3.5 bg-[#181116] border border-red-500/30 rounded-md space-y-1.5">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-1.5">
              <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                WHY INVESTIGATE THIS INCIDENT?
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                RISK HYPOTHESIS
              </span>
            </div>
            <p className="text-xs text-slate-200 font-sans leading-relaxed pt-1">{data.why_investigate}</p>
          </div>

          {/* Recommended Analyst Actions */}
          <div className="p-3.5 bg-[#0D1814] border border-emerald-500/30 rounded-md space-y-2">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              RECOMMENDED REMEDIATION ACTIONS
            </div>
            <div className="space-y-1.5 pt-1">
              {data.recommended_actions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-[#0F1420] border border-emerald-500/30 rounded text-xs text-slate-200 font-sans flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 font-mono" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIExplanation;

