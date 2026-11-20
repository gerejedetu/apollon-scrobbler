/**
 * A D1-compatible database backed by `node:sqlite`, so adapters and the API can be tested
 * against real SQL (same engine family as D1) without Miniflare.
 * Implements the subset of the D1 API the adapters use: prepare/bind/first/all/run/batch/exec.
 */
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

type Value = SQLInputValue | undefined | boolean;

export interface SqliteD1Meta {
  changes: number;
  last_row_id: number;
  rows_read: number;
  rows_written: number;
}

export interface SqliteD1Result<T = Record<string, unknown>> {
  results: T[];
  success: true;
  meta: SqliteD1Meta;
}

function toSql(v: Value): SQLInputValue {
  if (v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

export class SqliteD1Statement {
  constructor(
    private readonly db: DatabaseSync,
    readonly sql: string,
    private readonly params: SQLInputValue[] = [],
  ) {}

  bind(...values: Value[]): SqliteD1Statement {
    return new SqliteD1Statement(this.db, this.sql, values.map(toSql));
  }

  async first<T = Record<string, unknown>>(column?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.params) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }

  async all<T = Record<string, unknown>>(): Promise<SqliteD1Result<T>> {
    return this.execute<T>();
  }

  async run<T = Record<string, unknown>>(): Promise<SqliteD1Result<T>> {
    return this.execute<T>();
  }

  /** Synchronous execution, used by batch() inside a transaction. */
  execute<T>(): SqliteD1Result<T> {
    const stmt = this.db.prepare(this.sql);
    if (stmt.columns().length > 0) {
      const results = stmt.all(...this.params) as T[];
      return {
        results,
        success: true,
        meta: { changes: 0, last_row_id: 0, rows_read: results.length, rows_written: 0 },
      };
    }
    const r = stmt.run(...this.params);
    const changes = Number(r.changes);
    return {
      results: [],
      success: true,
      meta: {
        changes,
        last_row_id: Number(r.lastInsertRowid),
        rows_read: 0,
        rows_written: changes,
      },
    };
  }
}

export class SqliteD1 {
  readonly raw: DatabaseSync;
  /** Number of statements executed, to assert on round trips in tests. */
  statements = 0;
  /** Number of `batch()` / single-statement calls (each one is a network round trip on real D1). */
  roundTrips = 0;

  constructor(path = ":memory:") {
    this.raw = new DatabaseSync(path);
    this.raw.exec("PRAGMA foreign_keys = ON;");
  }

  prepare(sql: string): SqliteD1Statement {
    const statement = new SqliteD1Statement(this.raw, sql);
    // Count round trips by wrapping the async entry points.
    const count = <F extends (...args: never[]) => unknown>(fn: F): F =>
      ((...args: never[]) => {
        this.roundTrips++;
        this.statements++;
        return fn(...args);
      }) as F;
    const wrap = (s: SqliteD1Statement): SqliteD1Statement => {
      const bind = s.bind.bind(s);
      s.first = count(s.first.bind(s)) as typeof s.first;
      s.all = count(s.all.bind(s)) as typeof s.all;
      s.run = count(s.run.bind(s)) as typeof s.run;
      s.bind = (...values: Value[]) => wrap(bind(...values));
      return s;
    };
    return wrap(statement);
  }

  async batch<T = Record<string, unknown>>(
    statements: SqliteD1Statement[],
  ): Promise<SqliteD1Result<T>[]> {
    this.roundTrips++;
    this.statements += statements.length;
    this.raw.exec("BEGIN");
    try {
      const out = statements.map((s) => s.execute<T>());
      this.raw.exec("COMMIT");
      return out;
    } catch (e) {
      this.raw.exec("ROLLBACK");
      throw e;
    }
  }

  async exec(sql: string): Promise<{ count: number; duration: number }> {
    this.raw.exec(sql);
    return { count: 1, duration: 0 };
  }
}
