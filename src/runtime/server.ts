import type { Database } from 'better-sqlite3';

export interface ServerOptions {
  port: number;
  db: Database;
  graphDir: string;
}

export function createServer(options: ServerOptions): { start(): Promise<void>; stop(): Promise<void> } {
  throw new Error('not implemented');
}
