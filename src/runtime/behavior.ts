import type { Database } from 'better-sqlite3';

export interface BehaviorInput {
  name: string;
  action: string;
  payload: unknown;
  session: Record<string, unknown>;
}

export interface BehaviorResult {
  success: boolean;
  mutations: unknown[];
  effects: unknown[];
  error?: string;
}

export async function executeBehavior(input: BehaviorInput, db: Database): Promise<BehaviorResult> {
  throw new Error('not implemented');
}
