// Pass 4: Constraint validation
// Checks: traversal paths, assert expressions, compute refs
import type { Database } from 'better-sqlite3';
import type { TypeCheckError } from './errors.js';
import type { TypeMap } from './type-map.js';

export function run(db: Database, typeMap: TypeMap): TypeCheckError[] {
  throw new Error('not implemented');
}
