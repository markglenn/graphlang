import type { Database } from 'better-sqlite3';

export interface RenderContext {
  projection: string;
  params: Record<string, string>;
  session: Record<string, unknown>;
  db: Database;
}

export async function renderProjection(ctx: RenderContext): Promise<string> {
  throw new Error('not implemented');
}
