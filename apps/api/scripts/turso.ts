/**
 * Turso maintenance, run from a machine (not the Worker). Reads TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
 * from the environment or from apps/api/.env.turso (git-ignored, see .env.turso.example).
 *
 *   vpx scripts/turso.ts migrate              apply pending migrations (packages/db-d1/migrations)
 *   vpx scripts/turso.ts status               applied / pending migrations and row counts
 *   vpx scripts/turso.ts import <dump.sql>    run a data-only SQL dump (e.g. from `wrangler d1 export --no-schema`)
 *   vpx scripts/turso.ts backfill-credits     fill artist_credits from the listens already stored
 *   vpx scripts/turso.ts merge-artist <from> <to>          rename an artist everywhere (and remember the alias)
 *   vpx scripts/turso.ts merge-album <artist> <from> <to>  rename one artist's album everywhere
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { creditPairs } from "@scrobbler/core";
import { MIGRATIONS_DIR } from "@scrobbler/db-d1/testing";

const root = fileURLToPath(new URL("..", import.meta.url));
const envFile = join(root, ".env.turso");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m?.[1] && !line.trimStart().startsWith("#") && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2];
  }
}
const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error(
    "Missing TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN): set them in apps/api/.env.turso.",
  );
  process.exit(1);
}
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN, intMode: "number" });

/** Tables in foreign-key order (parents first), for imports and counts. */
const TABLES = [
  "user",
  "session",
  "account",
  "verification",
  "apikey",
  "users",
  "listens",
  "playing_now",
  "latest_imports",
  "artist_credits",
  "loved_tracks",
  "obsessions",
];

async function applied(): Promise<Set<string>> {
  await db.execute(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL) STRICT",
  );
  const rs = await db.execute("SELECT name FROM _migrations");
  return new Set(rs.rows.map((r) => r.name as string));
}

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function migrate() {
  const done = await applied();
  const pending = migrationFiles().filter((f) => !done.has(f));
  for (const file of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    // One migration = one transaction: its statements and its bookkeeping row commit together.
    const tx = await db.transaction("write");
    try {
      await tx.executeMultiple(sql);
      await tx.execute({
        sql: "INSERT INTO _migrations (name, applied_at) VALUES (?, ?)",
        args: [file, Math.floor(Date.now() / 1000)],
      });
      await tx.commit();
      console.log(`applied ${file}`);
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  }
  if (pending.length === 0) console.log("No migrations to apply.");
}

async function counts() {
  // count(*) reads every row: fine for an occasional check, never in the API.
  const rs = await db.batch(
    TABLES.map((t) => `SELECT '${t}' AS t, count(*) AS n FROM "${t}"`),
    "read",
  );
  for (const r of rs)
    console.log(
      `${((r.rows[0]?.t as string | undefined) ?? "").padEnd(16)} ${(r.rows[0]?.n as number | undefined) ?? 0}`,
    );
}

async function status() {
  const done = await applied();
  for (const f of migrationFiles()) console.log(`${done.has(f) ? "applied" : "PENDING"}  ${f}`);
  await counts();
}

async function importDump(path: string) {
  const sql = readFileSync(path, "utf8")
    .split("\n")
    // D1 exports may carry PRAGMAs and the D1 bookkeeping tables: keep only rows of our tables.
    .filter(
      (line) =>
        /^INSERT INTO "?(\w+)"?/.test(line) &&
        TABLES.includes(/^INSERT INTO "?(\w+)"?/.exec(line)![1]!),
    )
    .join("\n");
  const statements = sql.split("\n").filter(Boolean).length;
  const tx = await db.transaction("write");
  try {
    await tx.executeMultiple(sql);
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
  console.log(`imported ${statements} rows from ${path}`);
  await counts();
}

async function backfillCredits() {
  // Reads each distinct credit once through the (user_id, artist_name, ...) index.
  const rs = await db.execute("SELECT DISTINCT artist_name FROM listens");
  const pairs = creditPairs(rs.rows.map((r) => r.artist_name as string));
  console.log(`${rs.rows.length} credits, ${pairs.length} (credit, artist) pairs to record.`);
  if (pairs.length === 0) return;
  await db.execute({
    sql: "INSERT OR IGNORE INTO artist_credits (credit, artist) SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?)",
    args: [JSON.stringify(pairs)],
  });
  console.log("Done.");
}

/** Renames, never deletes: a listen that would collide with one already under the new name is reported. */
async function mergeArtist(from: string, to: string) {
  const rs = await db.batch(
    [
      {
        sql: "UPDATE OR IGNORE listens SET artist_name = ?2 WHERE artist_name = ?1",
        args: [from, to],
      },
      {
        sql: "UPDATE OR IGNORE loved_tracks SET artist_name = ?2 WHERE artist_name = ?1",
        args: [from, to],
      },
      { sql: "UPDATE obsessions SET artist_name = ?2 WHERE artist_name = ?1", args: [from, to] },
      {
        sql: "INSERT OR IGNORE INTO artist_aliases (alias, artist) VALUES (?1, ?2)",
        args: [from, to],
      },
      { sql: "SELECT count(*) AS n FROM listens WHERE artist_name = ?1", args: [from] },
    ],
    "write",
  );
  console.log(
    `listens moved: ${rs[0]?.rowsAffected}, loved: ${rs[1]?.rowsAffected}, obsessions: ${rs[2]?.rowsAffected}`,
  );
  console.log(
    `left under "${from}" (duplicates of a listen already under "${to}"): ${rs[4]?.rows[0]?.n as number}`,
  );
}

async function mergeAlbum(artist: string, from: string, to: string) {
  const rs = await db.batch(
    [
      {
        sql: "UPDATE OR IGNORE listens SET release_name = ?3 WHERE artist_name = ?1 AND release_name = ?2",
        args: [artist, from, to],
      },
      {
        sql: "UPDATE loved_tracks SET release_name = ?3 WHERE artist_name = ?1 AND release_name = ?2",
        args: [artist, from, to],
      },
      { sql: "UPDATE users SET data_version = data_version + 1", args: [] },
    ],
    "write",
  );
  console.log(`listens moved: ${rs[0]?.rowsAffected}, loved: ${rs[1]?.rowsAffected}`);
}

const [command, arg] = process.argv.slice(2);
switch (command) {
  case "migrate":
    await migrate();
    break;
  case "status":
    await status();
    break;
  case "import":
    if (!arg) throw new Error("usage: import <dump.sql>");
    await importDump(arg);
    break;
  case "backfill-credits":
    await backfillCredits();
    break;
  case "merge-artist": {
    const [from, to] = process.argv.slice(3);
    if (!from || !to) throw new Error("usage: merge-artist <from> <to>");
    await mergeArtist(from, to);
    break;
  }
  case "merge-album": {
    const [artist, from, to] = process.argv.slice(3);
    if (!artist || !from || !to) throw new Error("usage: merge-album <artist> <from> <to>");
    await mergeAlbum(artist, from, to);
    break;
  }
  default:
    console.error(
      "usage: vpx scripts/turso.ts migrate | status | import <dump.sql> | backfill-credits",
    );
    process.exit(1);
}
db.close();
