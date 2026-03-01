import type { Database } from 'better-sqlite3';

export interface Session {
  id: string;
  user_id: string | null;
  data: Record<string, unknown>;
  expires_at: string | null;
}

export function createSession(db: Database): Session {
  throw new Error('not implemented');
}

export function getSession(id: string, db: Database): Session | null {
  throw new Error('not implemented');
}

export function destroySession(id: string, db: Database): void {
  throw new Error('not implemented');
}
