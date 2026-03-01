import type { Database } from 'better-sqlite3';

export interface ConstraintResult {
  passed: boolean;
  constraint: string;
  message?: string;
}

export function evaluateConstraint(
  constraintName: string,
  context: Record<string, unknown>,
  db: Database
): ConstraintResult {
  throw new Error('not implemented');
}
