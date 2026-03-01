// Builds the dependency graph between .graph files and compute modules
// Used for incremental type checking and watch mode

export interface DependencyGraph {
  // Maps file path -> set of file paths that depend on it
  dependents: Map<string, Set<string>>;
  // Maps file path -> set of file paths it depends on
  dependencies: Map<string, Set<string>>;
}

export function buildDependencyGraph(graphDir: string): DependencyGraph {
  throw new Error('not implemented');
}

export function getAffectedFiles(changed: string[], graph: DependencyGraph): Set<string> {
  throw new Error('not implemented');
}
