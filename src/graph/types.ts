// Graph store types — the runtime representation of parsed .graph files

export type CardinalityType = 'has_many' | 'has_one' | 'belongs_to' | 'many_to_many';

export type NodeType =
  | 'entity'
  | 'edge'
  | 'compute'
  | 'constraint'
  | 'policy'
  | 'behavior'
  | 'projection'
  | 'component'
  | 'adapter'
  | 'listener';

export interface GraphNode {
  id: string;
  type: NodeType;
  properties: Record<string, unknown>;
  source_file: string | null;
  source_line: number | null;
}

export interface GraphEdge {
  id: string;
  from_node: string;
  to_node: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
