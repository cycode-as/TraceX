import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle2, Info, ChevronRight, X, Database, Lightbulb } from 'lucide-react';
import type { Evidence } from '../types/evidence';

interface EvidencePanelProps {
  evidenceList?: Evidence[];
  loading?: boolean;
  className?: string;
}

/**
 * Helper to determine epistemic status (FACT vs INFERENCE)
 * Rule / Heuristic:
 * - FACT: Directly observed telemetry event linked to a specific event_id.
 * - INFERENCE: System interpretation, derived baseline shift, or multi-event correlation without a single event source.
 */
export function getEpistemicStatus(item: Evidence): {
  type: 'FACT' | 'INFERENCE';
  label: string;
  badgeStyle: string;
  icon: React.ElementType;
} {
  if (item.event_id && item.event_id.trim() !== '') {
    return {
      type: 'FACT',
      label: 'FACT (Log Data)',
      badgeStyle: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
      icon: Database,
    };
  }
  return {
    type: 'INFERENCE',
    label: 'INFERENCE (Hypothesis)',
    badgeStyle: 'bg-purple-500/15 text-purple-300 border-purple-500/40 border-dashed',
    icon: Lightbulb,
  };
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidenceList = [],
  loading = false,
  className = '',
}) => {
  const [selectedItem, setSelectedItem] = useState<Evidence | null>(null);

  // Default fallback evidence list if none provided
  const items: Evidence[] = evidenceList.length > 0 ? evidenceList : [
    {
      evidence_id: 'EVD-101',
      incident_id: 'INC-042',
      event_id: 'EVT-1021',
      type: 'SUPPORTING',
      description: 'MFA failure followed by immediate session creation from unrecognized geolocation (Bucharest, Romania).',
      impact: 'increases_priority (+24)',
    },
    {
      evidence_id: 'EVD-102',
      incident_id: 'INC-042',
      event_id: 'EVT-1025',
      type: 'SUPPORTING',
      description: 'Unauthorized privilege change to db_admin granted outside change window.',
      impact: 'increases_priority (+18)',
    },
    {
      evidence_id: 'EVD-103',
      incident_id: 'INC-042',
      event_id: 'EVT-1028',
      type: 'SUPPORTING',
      description: 'Large file transfer (650 MB) initiated directly from sensitive finance vault DB.',
      impact: 'increases_priority (+30)',
    },
    {
      evidence_id: 'EVD-104',
      incident_id: 'INC-042',
      // No single event_id: system inference across temporal sequence
      type: 'SUPPORTING',
      description: 'Temporal sequence alignment suggests potential automated session takeover attack chain.',
      impact: 'increases_priority (+15)',
    },
    {
      evidence_id: 'EVD-201',
      incident_id: 'INC-042',
      event_id: 'EVT-1010',
      type: 'MITIGATING',
      description: 'User USR-007 completed hardware security key MFA verification 2 hours prior.',
      impact: 'reduces_priority (-12)',
    },
    {
      evidence_id: 'EVD-202',
      incident_id: 'INC-042',
      event_id: 'EVT-1012',
      type: 'MITIGATING',
      description: 'Device DEV-882 is enrolled in enterprise Mobile Device Management (MDM) with active endpoint agent.',
      impact: 'reduces_priority (-8)',
    },
  ];

  const supportingItems = items.filter((e) => e.type === 'SUPPORTING' || e.type === 'ANOMALY' || e.type === 'PROGRESSION');
  const mitigatingItems = items.filter((e) => e.type === 'MITIGATING');

  return (
    <div className={`space-y-4 font-mono ${className}`}>
      <div className="flex items-center justify-between border-b border-[#1E2530] pb-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">
            STRUCTURED EVIDENCE FINDINGS
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">Distinguishes Observed Facts from Inferred Reasoning</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-28 bg-[#0F1420] rounded-md animate-pulse border border-[#1E2530]" />
          <div className="h-28 bg-[#0F1420] rounded-md animate-pulse border border-[#1E2530]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supporting Evidence (Red-tinted) */}
          <div className="bg-[#181116] border-2 border-red-500/30 rounded-md p-4 space-y-3 shadow-[0_0_15px_rgba(239,68,68,0.08)]">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>SUPPORTING EVIDENCE ({supportingItems.length})</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold">
                INCREASES PRIORITY
              </span>
            </div>

            <div className="space-y-2">
              {supportingItems.map((item) => {
                const epistemic = getEpistemicStatus(item);
                const IconComp = epistemic.icon;

                return (
                  <div
                    key={item.evidence_id}
                    onClick={() => setSelectedItem(item)}
                    className="p-3 bg-[#0F1420] border border-red-500/30 hover:border-red-400 rounded-md transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-red-400">{item.evidence_id}</span>
                      
                      {/* Epistemic Status Badge (Fact vs Inference) */}
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold flex items-center gap-1 ${epistemic.badgeStyle}`}>
                        <IconComp className="w-3 h-3 shrink-0" />
                        {epistemic.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-sans leading-relaxed group-hover:text-white">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-red-400 font-semibold border-t border-[#1E2530]">
                      <span className="text-slate-400">
                        Source: <strong className="text-slate-200">{item.event_id || 'Derived Correlation'}</strong>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mitigating Evidence (Green-tinted) */}
          <div className="bg-[#0D1814] border-2 border-emerald-500/30 rounded-md p-4 space-y-3 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>MITIGATING EVIDENCE ({mitigatingItems.length})</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                REDUCES PRIORITY
              </span>
            </div>

            <div className="space-y-2">
              {mitigatingItems.map((item) => {
                const epistemic = getEpistemicStatus(item);
                const IconComp = epistemic.icon;

                return (
                  <div
                    key={item.evidence_id}
                    onClick={() => setSelectedItem(item)}
                    className="p-3 bg-[#0F1420] border border-emerald-500/30 hover:border-emerald-400 rounded-md transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">{item.evidence_id}</span>
                      
                      {/* Epistemic Status Badge (Fact vs Inference) */}
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold flex items-center gap-1 ${epistemic.badgeStyle}`}>
                        <IconComp className="w-3 h-3 shrink-0" />
                        {epistemic.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-sans leading-relaxed group-hover:text-white">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-400 font-semibold border-t border-[#1E2530]">
                      <span className="text-slate-400">
                        Source: <strong className="text-slate-200">{item.event_id || 'Derived Correlation'}</strong>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Item Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F1420] border-2 border-cyan-500 rounded-md max-w-lg w-full p-5 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-[#1E2530] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">EVIDENCE DETAIL — {selectedItem.evidence_id}</h4>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Epistemic Status:</span>
                <span className={`px-2 py-0.5 rounded border font-bold text-[11px] ${getEpistemicStatus(selectedItem).badgeStyle}`}>
                  {getEpistemicStatus(selectedItem).type === 'FACT' ? 'FACT — Directly Observed Log Data' : 'INFERENCE — System Derived Hypothesis'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Evidence Impact:</span>
                <span className="text-cyan-400 font-bold">{selectedItem.type} ({selectedItem.impact})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Source Event ID:</span>
                <span className="text-white font-bold">{selectedItem.event_id || 'N/A (Derived Correlation)'}</span>
              </div>
              <div className="pt-2 text-slate-300 font-sans bg-[#0B0E14] p-3 rounded border border-[#1E2530] leading-relaxed">
                {selectedItem.description}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidencePanel;

