/**
 * Node-only helper: a migrated in-memory database for tests of this adapter and of apps using it.
 * Not exported from the main entry so it never reaches a Worker bundle.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SqliteD1 } from "@scrobbler/testing";

export const MIGRATIONS_DIR = fileURLToPath(new URL("../migrations", import.meta.url));

export function createMigratedD1(): SqliteD1 {
  const db = new SqliteD1();
  for (const file of readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    db.raw.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }
  return db;
}

/** Inserts a bare Better Auth account row, so profiles can be created without running Better Auth. */
export function insertAuthUser(db: SqliteD1, id: string, username = id): void {
  const now = new Date().toISOString();
  db.raw
    .prepare(
      'INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt, username) VALUES (?, ?, ?, 0, ?, ?, ?)',
    )
    .run(id, username, `${id}@example.test`, now, now, username.toLowerCase());
}
