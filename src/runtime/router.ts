import type { Database } from 'better-sqlite3';

export interface RouteMatch {
  projection: string;
  params: Record<string, string>;
}

export function matchRoute(pathname: string, db: Database): RouteMatch | null {
  throw new Error('not implemented');
}

export function buildRouteTable(db: Database): Map<string, string> {
  throw new Error('not implemented');
}
