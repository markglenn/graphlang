// Pass 6: Projection type checking
// Checks: bindings, state, derived, forms, actions, match exhaustiveness
import type { Database } from 'better-sqlite3';
import type { TypeCheckError } from './errors.js';
import type { TypeMap } from './type-map.js';

export function run(db: Database, typeMap: TypeMap): TypeCheckError[] {
  throw new Error('not implemented');
}
