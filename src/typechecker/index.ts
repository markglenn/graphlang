import type { Database } from 'better-sqlite3';
import type { TypeCheckError } from './errors.js';
import type { TypeMap } from './type-map.js';
import { run as runEntity } from './pass-entity.js';
import { run as runEdge } from './pass-edge.js';
import { run as runCompute } from './pass-compute.js';
import { run as runConstraint } from './pass-constraint.js';
import { run as runBehavior } from './pass-behavior.js';
import { run as runProjection } from './pass-projection.js';
import { run as runPolicy } from './pass-policy.js';
import { run as runCrosscutting } from './pass-crosscutting.js';
import { run as runComponent } from './pass-component.js';
import { run as runAdapter } from './pass-adapter.js';

export function typecheck(db: Database): TypeCheckError[] {
  throw new Error('not implemented');
}

// The passes, in order. The orchestrator runs all and merges results.
export const passes: Array<(db: Database, typeMap: TypeMap) => TypeCheckError[]> = [
  runEntity,
  runEdge,
  runCompute,
  runConstraint,
  runBehavior,
  runProjection,
  runPolicy,
  runCrosscutting,
  runComponent,
  runAdapter,
];
