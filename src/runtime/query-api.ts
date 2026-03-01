import type { Database } from 'better-sqlite3';

export interface QueryOptions {
  entity: string;
  filter?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface QueryResult {
  rows: Array<Record<string, unknown>>;
  total: number;
}

export function queryEntity(options: QueryOptions, db: Database): QueryResult {
  throw new Error('not implemented');
}

export function getEntityById(entity: string, id: string, db: Database): Record<string, unknown> | null {
  throw new Error('not implemented');
}
