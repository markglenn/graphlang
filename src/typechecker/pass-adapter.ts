// Pass 10: Adapter validation
// Checks: action contracts, param types, phase ordering
import type { Database } from 'better-sqlite3';
import type { TypeCheckError } from './errors.js';
import type { TypeMap } from './type-map.js';

export function run(db: Database, typeMap: TypeMap): TypeCheckError[] {
  throw new Error('not implemented');
}
