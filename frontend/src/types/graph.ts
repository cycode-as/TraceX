export interface GraphNode {
  id: string;
  label: string;
  type: 'host' | 'user' | 'process' | 'ip' | 'file';
  details?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export interface InvestigationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
