/**
 * The subset of Cloudflare's D1 API this adapter relies on, typed structurally so that both the real
 * `D1Database` binding and the node:sqlite double from `@scrobbler/testing` fit without casts.
 */
export interface D1ResultLike<T = unknown> {
  results: T[];
  meta: { changes: number; rows_read?: number; rows_written?: number };
}

export interface D1StatementLike {
  bind(...values: unknown[]): D1StatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1ResultLike<T>>;
  run(): Promise<D1ResultLike>;
}

export interface D1Like {
  prepare(sql: string): D1StatementLike;
  batch<T = unknown>(statements: D1StatementLike[]): Promise<D1ResultLike<T>[]>;
}
