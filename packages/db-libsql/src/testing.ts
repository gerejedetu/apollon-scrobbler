/**
 * Node-only: a migrated libSQL database in a temporary file, for tests. (`:memory:` is avoided on
 * purpose: libSQL may open a second connection for a transaction, which would see an empty database.)
 */
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { MIGRATIONS_DIR } from "@scrobbler/db-d1/testing";
import { LibsqlDriver } from "./driver.ts";

export function createMigratedLibsql(): LibsqlDriver {
  const dir = mkdtempSync(join(tmpdir(), "scrobbler-libsql-"));
  const client = createClient({ url: `file:${join(dir, "test.db")}` });
  const migrations = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8"));
  const ready = (async () => {
    await client.execute("PRAGMA foreign_keys = ON");
    for (const sql of migrations) await client.executeMultiple(sql);
  })();
  return new LibsqlDriver(client, ready);
}
