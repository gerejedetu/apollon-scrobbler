/**
 * Makes a libSQL client (Turso) look like the D1 API that the SQLite repositories in @scrobbler/db-d1
 * are written against, so both backends run exactly the same SQL, migrations and tests.
 *
 * It also has `exec`, which makes Better Auth recognise it as a D1-style database and use its SQLite dialect:
 * one connection object serves the scrobbler and the accounts.
 */
import type { D1Like, D1ResultLike, D1StatementLike } from "@scrobbler/db-d1";

type Value = null | string | number | bigint | ArrayBuffer | Uint8Array;

/** The subset of `@libsql/client`'s `Client` used here (typed structurally: no runtime dependency). */
export interface LibsqlClientLike {
  execute(stmt: { sql: string; args: Value[] }): Promise<LibsqlResultSet>;
  batch(
    stmts: { sql: string; args: Value[] }[],
    mode?: "write" | "read" | "deferred",
  ): Promise<LibsqlResultSet[]>;
  executeMultiple(sql: string): Promise<void>;
}

export interface LibsqlResultSet {
  columns: string[];
  rows: ArrayLike<unknown>[];
  rowsAffected: number;
  lastInsertRowid: bigint | undefined;
}

function toValue(v: unknown): Value {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v as Value;
}

function toResult<T>(rs: LibsqlResultSet): D1ResultLike<T> & { meta: { last_row_id: number } } {
  const results = rs.rows.map(
    (row) => Object.fromEntries(rs.columns.map((c, i) => [c, row[i]])) as T,
  );
  return {
    results,
    meta: {
      changes: rs.rowsAffected,
      last_row_id: rs.lastInsertRowid === undefined ? 0 : Number(rs.lastInsertRowid),
      rows_read: results.length,
    },
  };
}

/** Statements that only read can run as a read batch (no write lock, eligible for replicas). */
const READ_ONLY = /^\s*(SELECT|WITH)\b/i;

export class LibsqlStatement implements D1StatementLike {
  constructor(
    private readonly driver: LibsqlDriver,
    readonly sql: string,
    readonly args: Value[] = [],
  ) {}

  bind(...values: unknown[]): LibsqlStatement {
    return new LibsqlStatement(this.driver, this.sql, values.map(toValue));
  }

  async all<T = Record<string, unknown>>(): Promise<D1ResultLike<T>> {
    return toResult<T>(await this.driver.run(this));
  }

  async first<T = Record<string, unknown>>(column?: string): Promise<T | null> {
    const { results } = await this.all<Record<string, unknown>>();
    const row = results[0];
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }

  async run(): Promise<D1ResultLike> {
    return this.all();
  }
}

export class LibsqlDriver implements D1Like {
  /** Network round trips made (one per statement outside a batch, one per batch). */
  roundTrips = 0;

  /**
   * @param ready resolved before the first query; tests use it to apply migrations without making
   *              every caller await.
   */
  constructor(
    private readonly client: LibsqlClientLike,
    private readonly ready: Promise<unknown> = Promise.resolve(),
  ) {}

  prepare(sql: string): LibsqlStatement {
    return new LibsqlStatement(this, sql);
  }

  /** @internal */
  async run(statement: LibsqlStatement): Promise<LibsqlResultSet> {
    await this.ready;
    this.roundTrips++;
    return this.client.execute({ sql: statement.sql, args: statement.args });
  }

  /** Atomic, like D1: every statement runs in one transaction, in order, on one connection. */
  async batch<T = unknown>(statements: D1StatementLike[]): Promise<D1ResultLike<T>[]> {
    await this.ready;
    this.roundTrips++;
    const list = statements as LibsqlStatement[];
    const mode = list.every((s) => READ_ONLY.test(s.sql)) ? "read" : "write";
    const results = await this.client.batch(
      list.map((s) => ({ sql: s.sql, args: s.args })),
      mode,
    );
    return results.map((rs) => toResult<T>(rs));
  }

  /** Runs several `;`-separated statements (migrations; Better Auth's D1 detection looks for it). */
  async exec(sql: string): Promise<{ count: number; duration: number }> {
    await this.ready;
    await this.client.executeMultiple(sql);
    return { count: 1, duration: 0 };
  }
}
