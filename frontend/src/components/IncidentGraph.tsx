import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { User, Laptop, Key, Database, Activity, GitCommit, X, Info } from 'lucide-react';
import type { GraphData } from '../types/graph';

interface IncidentGraphProps {
  graphData?: GraphData;
  incidentId?: string;
  loading?: boolean;
  className?: string;
}

// Custom Node Components
const UserNode: React.FC<NodeProps> = ({ data }) => (
  <div className="bg-[#0F1420] border-2 border-cyan-500 rounded-md p-2.5 min-w-[130px] font-mono shadow-[0_0_12px_rgba(34,211,238,0.2)]">
    <Handle type="target" position={Position.Top} className="!bg-cyan-400" />
    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
      <User className="w-4 h-4" />
      <span>USER</span>
    </div>
    <div className="text-white text-xs font-semibold mt-1 truncate">
      {String(data.label || data.name || data.id || 'USR-101')}
    </div>
    {Boolean(data.role) && <div className="text-[10px] text-slate-400 mt-0.5">{String(data.role)}</div>}
    <Handle type="source" position={Position.Bottom} className="!bg-cyan-400" />
  </div>
);

const DeviceNode: React.FC<NodeProps> = ({ data }) => (
  <div className="bg-[#0F1420] border-2 border-purple-500 rounded-md p-2.5 min-w-[130px] font-mono shadow-[0_0_12px_rgba(168,85,247,0.2)]">
    <Handle type="target" position={Position.Top} className="!bg-purple-400" />
    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
      <Laptop className="w-4 h-4" />
      <span>DEVICE</span>
    </div>
    <div className="text-white text-xs font-semibold mt-1 truncate">
      {String(data.label || data.name || data.id || 'DEV-882')}
    </div>
    {Boolean(data.ip) && <div className="text-[10px] text-slate-400 mt-0.5">{String(data.ip)}</div>}
    <Handle type="source" position={Position.Bottom} className="!bg-purple-400" />
  </div>
);

const SessionNode: React.FC<NodeProps> = ({ data }) => (
  <div className="bg-[#0F1420] border-2 border-amber-500 rounded-md p-2.5 min-w-[130px] font-mono shadow-[0_0_12px_rgba(245,158,11,0.2)]">
    <Handle type="target" position={Position.Top} className="!bg-amber-400" />
    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
      <Key className="w-4 h-4" />
      <span>SESSION</span>
    </div>
    <div className="text-white text-xs font-semibold mt-1 truncate">
      {String(data.label || data.id || 'SES-001')}
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-amber-400" />
  </div>
);

const ResourceNode: React.FC<NodeProps> = ({ data }) => (
  <div className="bg-[#0F1420] border-2 border-emerald-500 rounded-md p-2.5 min-w-[130px] font-mono shadow-[0_0_12px_rgba(16,185,129,0.2)]">
    <Handle type="target" position={Position.Top} className="!bg-emerald-400" />
    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
      <Database className="w-4 h-4" />
      <span>RESOURCE</span>
    </div>
    <div className="text-white text-xs font-semibold mt-1 truncate">
      {String(data.label || data.name || data.id || 'finance-db')}
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-emerald-400" />
  </div>
);

const EventNode: React.FC<NodeProps> = ({ data }) => (
  <div className="bg-[#0F1420] border-2 border-blue-500 rounded-md p-2.5 min-w-[130px] font-mono shadow-[0_0_12px_rgba(59,130,246,0.2)]">
    <Handle type="target" position={Position.Top} className="!bg-blue-400" />
    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
      <Activity className="w-4 h-4" />
      <span>EVENT</span>
    </div>
    <div className="text-white text-xs font-semibold mt-1 truncate">
      {String(data.label || data.id || 'EVT-001')}
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
  </div>
);

const nodeTypes = {
  USER: UserNode,
  user: UserNode,
  DEVICE: DeviceNode,
  device: DeviceNode,
  SESSION: SessionNode,
  session: SessionNode,
  RESOURCE: ResourceNode,
  resource: ResourceNode,
  EVENT: EventNode,
  event: EventNode,
};

interface EdgePopoverData {
  id: string;
  source: string;
  target: string;
  reason: string;
  score: number | string;
  strength?: number;
}

export const IncidentGraph: React.FC<IncidentGraphProps> = ({
  graphData,
  loading = false,
  className = '',
}) => {
  const [selectedEdge, setSelectedEdge] = useState<EdgePopoverData | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ id: string; type: string; data: Record<string, unknown> } | null>(null);

  // Construct React Flow Nodes and Edges from graphData
  const { nodes, edges } = useMemo(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      // Default fallback graph for initial render
      const defaultNodes: Node[] = [
        { id: 'usr-1', type: 'USER', position: { x: 250, y: 30 }, data: { label: 'USR-007', role: 'Database Admin' } },
        { id: 'dev-1', type: 'DEVICE', position: { x: 80, y: 150 }, data: { label: 'DEV-882', ip: '192.168.1.104' } },
        { id: 'ses-1', type: 'SESSION', position: { x: 420, y: 150 }, data: { label: 'SES-9921' } },
        { id: 'res-1', type: 'RESOURCE', position: { x: 250, y: 280 }, data: { label: 'finance-vault-db' } },
        { id: 'evt-1', type: 'EVENT', position: { x: 420, y: 280 }, data: { label: 'large_transfer' } },
      ];

      const defaultEdges: Edge[] = [
        {
          id: 'e1',
          source: 'usr-1',
          target: 'dev-1',
          label: 'Same user · score 0.94',
          data: { reason: 'Same session · Same device · 4 minutes apart · score 0.94', score: 0.94 },
        },
        {
          id: 'e2',
          source: 'usr-1',
          target: 'ses-1',
          label: 'Active session · score 0.91',
          data: { reason: 'Active session initiated from new IP Indore · score 0.91', score: 0.91 },
        },
        {
          id: 'e3',
          source: 'dev-1',
          target: 'res-1',
          label: 'Direct access · score 0.88',
          data: { reason: 'Direct database connection established following MFA failure · score 0.88', score: 0.88 },
        },
        {
          id: 'e4',
          source: 'ses-1',
          target: 'evt-1',
          label: 'Exfiltration · score 0.95',
          data: { reason: '650 MB bulk transfer executed during off-hours · score 0.95', score: 0.95 },
        },
      ];

      return { nodes: defaultNodes, edges: defaultEdges };
    }

    const flowNodes: Node[] = graphData.nodes.map((n, idx) => ({
      id: n.id,
      type: n.type || 'USER',
      position: n.position || { x: (idx % 3) * 220 + 100, y: Math.floor(idx / 3) * 130 + 40 },
      data: n.data || { label: n.id },
    }));

    const flowEdges: Edge[] = graphData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || (e.data?.reason ? String(e.data.reason).slice(0, 25) + '...' : 'Correlated'),
      data: e.data || { reason: e.label || 'Same session · Temporal correlation', score: 0.92 },
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [graphData]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedNode(null);
    setSelectedEdge({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      reason: String(edge.data?.reason || edge.label || 'Correlated security events in session window'),
      score: (edge.data?.score as number | string) || '0.92',
    });
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedEdge(null);
    setSelectedNode({
      id: node.id,
      type: node.type || 'USER',
      data: node.data as Record<string, unknown>,
    });
  }, []);

  return (
    <div className={`bg-[#0F1420] border border-[#1E2530] rounded-md p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-[#1E2530] pb-2.5">
        <div className="flex items-center gap-2 font-mono">
          <GitCommit className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            INCIDENT ENTITY RELATIONSHIP GRAPH
          </h2>
          <span className="text-xs px-2 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Interactive
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Click graph edge or node to view correlation logic</span>
      </div>

      <div className="relative h-[360px] w-full border border-[#1E2530] rounded-md overflow-hidden bg-[#0B0E14]">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center font-mono text-xs text-slate-500">
            Loading relationship graph...
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onEdgeClick={onEdgeClick}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#1E2530" gap={16} size={1} />
            <Controls />
          </ReactFlow>
        )}

        {/* Edge Correlation Reasoning Popover */}
        {selectedEdge && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 bg-[#0F1420] border-2 border-cyan-500 rounded-md p-3 font-mono shadow-2xl z-50">
            <div className="flex items-center justify-between border-b border-[#1E2530] pb-2 mb-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                <Info className="w-4 h-4" />
                <span>CORRELATION REASONING</span>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* Epistemic Status Badge for Graph Edge */}
              <div className="flex items-center justify-between p-1.5 rounded bg-purple-950/40 border border-purple-500/30 text-[10px] text-purple-300 font-semibold">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  INFERRED RELATIONSHIP
                </span>
                <span className="text-slate-400">System Hypothesis</span>
              </div>

              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Connection:</span>
                <span className="text-white font-bold">{selectedEdge.source} ↔ {selectedEdge.target}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Correlation Strength:</span>
                <span className="text-cyan-400 font-bold">{selectedEdge.score}</span>
              </div>
              <div className="mt-1 text-slate-200 bg-[#0B0E14] p-2 rounded border border-[#1E2530] leading-relaxed">
                {selectedEdge.reason}
              </div>

              <p className="text-[10px] font-sans text-slate-400 italic">
                Note: Graph edges represent inferred statistical correlations across time and entity pivots — not a single verifiable log event.
              </p>
            </div>
          </div>
        )}

        {/* Node Detail Popover */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 bg-[#0F1420] border-2 border-blue-500 rounded-md p-3 font-mono shadow-2xl z-50">
            <div className="flex items-center justify-between border-b border-[#1E2530] pb-2 mb-2">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                <Info className="w-4 h-4" />
                <span>ENTITY DETAILS</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Type:</span>
                <span className="text-blue-400 font-bold">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Entity ID:</span>
                <span className="text-white font-bold">{selectedNode.id}</span>
              </div>
              <div className="mt-2 text-slate-200 bg-[#0B0E14] p-2 rounded border border-[#1E2530] space-y-1 text-[11px]">
                {Object.entries(selectedNode.data).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400">{k}:</span>
                    <span className="text-slate-200 font-semibold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentGraph;
