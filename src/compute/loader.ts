// Dynamically loads compute module TypeScript files at runtime

export interface ComputeModule {
  [functionName: string]: (...args: unknown[]) => unknown;
}

export async function loadComputeModule(sourcePath: string): Promise<ComputeModule> {
  throw new Error('not implemented');
}
