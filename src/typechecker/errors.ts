// TypeCheckError — the universal error type returned by all type checker passes

export type ErrorLevel = 'error' | 'warning' | 'info';

export interface TypeCheckError {
  level: ErrorLevel;
  code: string;
  source_file: string;
  source_line: number | null;
  node_id: string;
  node_type: string;
  message: string;
  expected?: string;
  received?: string;
  path?: string;
  suggestions: string[];
  related: Array<{ node_id: string; message: string }>;
}

export function formatError(err: TypeCheckError): string {
  const loc = err.source_line != null
    ? `${err.source_file}:${err.source_line}`
    : err.source_file;

  const lines: string[] = [
    `[${err.level.toUpperCase()}] ${err.code} — ${loc}`,
    `  ${err.message}`,
  ];

  if (err.expected !== undefined || err.received !== undefined) {
    if (err.expected !== undefined) lines.push(`  expected : ${err.expected}`);
    if (err.received !== undefined) lines.push(`  received : ${err.received}`);
  }

  if (err.path) {
    lines.push(`  path     : ${err.path}`);
  }

  if (err.suggestions.length > 0) {
    lines.push(`  suggestions:`);
    for (const s of err.suggestions) {
      lines.push(`    - ${s}`);
    }
  }

  if (err.related.length > 0) {
    lines.push(`  related:`);
    for (const r of err.related) {
      lines.push(`    - ${r.node_id}: ${r.message}`);
    }
  }

  return lines.join('\n');
}
