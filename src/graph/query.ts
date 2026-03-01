import type { Database } from 'better-sqlite3';
import type { GraphNode, GraphEdge, NodeType } from './types.js';

export function nodesOfType(db: Database, type: NodeType): GraphNode[] {
  throw new Error('not implemented');
}

export function nodeById(db: Database, id: string): GraphNode | null {
  throw new Error('not implemented');
}

export function edgesFrom(db: Database, nodeId: string, type?: string): GraphEdge[] {
  throw new Error('not implemented');
}

export function edgesTo(db: Database, nodeId: string, type?: string): GraphEdge[] {
  throw new Error('not implemented');
}
