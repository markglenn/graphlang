// Verifies that a loaded compute module satisfies its declared .gln signature
import type { ComputeModule } from './loader.js';
import type { TypeCheckError } from '../typechecker/errors.js';

export interface ComputeContract {
  name: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
}

export function checkContract(mod: ComputeModule, contract: ComputeContract): TypeCheckError[] {
  throw new Error('not implemented');
}
