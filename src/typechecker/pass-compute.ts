// Pass 3: Compute module signatures
// Checks: valid param types, source file existence, no duplicate names
import type { Database } from 'better-sqlite3';
import type { TypeCheckError } from './errors.js';
import type { TypeMap } from './type-map.js';

export function run(db: Database, typeMap: TypeMap): TypeCheckError[] {
  throw new Error('not implemented');
}
