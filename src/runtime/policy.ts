import type { Database } from 'better-sqlite3';

export interface PolicyDecision {
  allowed: boolean;
  policy: string;
  reason?: string;
}

export function evaluatePolicy(
  policyName: string,
  action: string,
  subject: Record<string, unknown>,
  db: Database
): PolicyDecision {
  throw new Error('not implemented');
}
