import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Bot,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  ListOrdered,
  FileText,
} from 'lucide-react';
import { explainIncident, getIncidentEvidence } from '../../services/incidents';
import type { ExplainResponse } from '../../services/incidents';
import type { Evidence } from '../../types/evidence';

interface AIExplanationProps {
  incidentId: string;
}

export const AIExplanation: React.FC<AIExplanationProps> = ({ incidentId }) => {
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [fallbackEvidence, setFallbackEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);

  const fetchAIExplanation = async () => {
    setLoading(true);
    setError(null);
    setIsFallbackMode(false);

    try {
      const res = await explainIncident(incidentId);

      if (res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res.error?.message || 'AI service returned an invalid response');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'AI explanation service error';
      setError(errorMsg);
      setIsFallbackMode(true);

      // Fetch fallback evidence data so section is never left blank
      try {
        const evRes = await getIncidentEvidence(incidentId);
        if (evRes.success && evRes.data) {
          setFallbackEvidence(evRes.data);
        }
      } catch {
        // Ignore secondary fallback error
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await explainIncident(incidentId);

        if (!isMounted) return;

        if (res.success && res.data) {
          setData(res.data);
        } else {
          throw new Error(res.error?.message || 'AI service returned an invalid response');
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : 'AI explanation service error';
          setError(errorMsg);
          setIsFallbackMode(true);

          getIncidentEvidence(incidentId).then((evRes) => {
            if (isMounted && evRes.success && evRes.data) {
              setFallbackEvidence(evRes.data);
            }
          });
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
  }, [incidentId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-slate-800 rounded-full" />
          <div className="h-5 w-48 bg-slate-800 rounded" />
        </div>
        <div className="h-16 bg-slate-800/40 rounded-lg" />
        <div className="h-24 bg-slate-800/40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-semibold text-slate-100">AI Incident Analysis</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
            LLM Copilot
          </span>
        </div>
        <button
          onClick={fetchAIExplanation}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Regenerate Explanation
        </button>
      </div>

      {/* Fallback Warning Banner if AI call failed */}
      {isFallbackMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>AI explanation unavailable</strong> — showing evidence-based summary instead.
              {error && <span className="text-amber-400/80 ml-1">({error})</span>}
            </span>
          </div>
          <button
            onClick={fetchAIExplanation}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded font-semibold border border-amber-500/40 shrink-0 cursor-pointer"
          >
            Retry AI
          </button>
        </div>
      )}

      {/* Standard AI Explanation Content */}
      {!isFallbackMode && data ? (
        <div className="space-y-5">
          {/* Executive Summary Paragraph */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-400">
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Executive Synthesis</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {data.summary}
            </p>
          </div>

          {/* Grid: Why Connected & Why Investigate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Why Connected */}
            {data.why_connected && data.why_connected.length > 0 && (
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 font-mono">
                  <HelpCircle className="w-4 h-4" />
                  <span>Why Connected?</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {data.why_connected.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Why Investigate */}
            {data.why_investigate && (
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 font-mono">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Why Investigate?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.why_investigate}
                </p>
              </div>
            )}
          </div>

          {/* Supporting & Mitigating Evidence lists from AI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.supporting_evidence && data.supporting_evidence.length > 0 && (
              <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 font-mono">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Supporting Evidence</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-300">
                  {data.supporting_evidence.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.mitigating_evidence && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mitigating Evidence</span>
                </div>
                {data.mitigating_evidence.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-300">
                    {data.mitigating_evidence.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">None observed</p>
                )}
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          {data.recommended_actions && data.recommended_actions.length > 0 && (
            <div className="p-4 bg-slate-950/70 border border-purple-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 font-mono">
                <ListOrdered className="w-4 h-4 text-purple-400" />
                <span>Recommended Analyst Response Actions</span>
              </div>
              <ol className="space-y-2 text-xs text-slate-200">
                {data.recommended_actions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5 leading-snug">{act}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        /* Fallback Evidence-Based View if AI Call fails */
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 uppercase">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Evidence-Based Incident Summary (Fallback)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Automated deterministic analysis identified correlated events requiring investigation for incident <strong className="font-mono text-slate-100">{incidentId}</strong>.
            </p>
          </div>

          {fallbackEvidence.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400">Observed Evidence Findings:</span>
              <ul className="space-y-2">
                {fallbackEvidence.map((ev) => (
                  <li
                    key={ev.evidence_id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-200 font-semibold">{ev.evidence_id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ev.type}
                      </span>
                    </div>
                    <p className="text-slate-300">{ev.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded">
              No evidence findings available to display in fallback mode.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIExplanation;
