import type { GraphNode, GraphEdge } from './types.js';

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS nodes (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  properties  JSON NOT NULL,
  source_file TEXT,
  source_line INTEGER
);

CREATE TABLE IF NOT EXISTS edges (
  id         TEXT PRIMARY KEY,
  from_node  TEXT NOT NULL REFERENCES nodes(id),
  to_node    TEXT NOT NULL REFERENCES nodes(id),
  type       TEXT NOT NULL,
  properties JSON DEFAULT '{}',
  UNIQUE(from_node, to_node, type)
);

CREATE TABLE IF NOT EXISTS entity_data (
  id          TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  data        JSON NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES entity_data(id),
  data       JSON DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_edges_from_type ON edges(from_node, type);
CREATE INDEX IF NOT EXISTS idx_edges_to_type   ON edges(to_node, type);
CREATE INDEX IF NOT EXISTS idx_edges_type       ON edges(type);
CREATE INDEX IF NOT EXISTS idx_nodes_type       ON nodes(type);
CREATE INDEX IF NOT EXISTS idx_entity_data_type ON entity_data(entity_type);
`;

export class GraphStore {
  open(path: string): void {
    throw new Error('not implemented');
  }

  close(): void {
    throw new Error('not implemented');
  }

  writeNodes(nodes: GraphNode[]): void {
    throw new Error('not implemented');
  }

  writeEdges(edges: GraphEdge[]): void {
    throw new Error('not implemented');
  }

  clear(): void {
    throw new Error('not implemented');
  }
}
