// Lints compute module source files for common issues

export interface LintResult {
  file: string;
  errors: Array<{ line: number; message: string }>;
}

export function lintComputeModule(sourcePath: string): LintResult {
  throw new Error('not implemented');
}
