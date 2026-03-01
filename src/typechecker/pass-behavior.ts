// Pass 5: Behavior type checking
// Checks: inputs, preconditions, compute steps, mutations, effects
import type { Database } from 'better-sqlite3';
import type { TypeCheckError } from './errors.js';
import type { TypeMap } from './type-map.js';

export function run(db: Database, typeMap: TypeMap): TypeCheckError[] {
  throw new Error('not implemented');
}
