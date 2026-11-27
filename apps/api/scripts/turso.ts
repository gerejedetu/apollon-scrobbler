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
 *   vpx scripts/turso.ts dedupe-albums [--apply]          list (then, with --apply, merge) albums whose names
 *                                                          differ only by store suffixes ("X - EP" → "X")
 *   vpx scripts/turso.ts dedupe-artists [--apply]         list (then, with --apply, merge) artists stored under
 *                                                          several names, and record every artist's spelling key
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import {
  albumNamedAfter,
  artistKey,
  creditPairs,
  isLatinOnly,
  isNativeOnly,
  withoutStoreSuffixes,
} from "@scrobbler/core";
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
      {
        sql: "UPDATE obsessions SET release_name = ?3 WHERE artist_name = ?1 AND release_name = ?2",
        args: [artist, from, to],
      },
      { sql: "UPDATE users SET data_version = data_version + 1", args: [] },
    ],
    "write",
  );
  console.log(
    `listens moved: ${rs[0]?.rowsAffected}, loved: ${rs[1]?.rowsAffected}, obsessions: ${rs[2]?.rowsAffected}`,
  );
}

/**
 * Albums stored before a store-suffix rule existed ("Love, Yerin - EP" next to "Love, Yerin"). Each name
 * joins the one new listens get (`withoutStoreSuffixes`), per user and artist. Dry run unless `apply`;
 * applying first writes every affected row to ~/stunning-winner-backups. Listens keep their release MBID,
 * so a sleeve found through the merged name's MBID still shows on the album.
 */
async function dedupeAlbums(apply: boolean) {
  // Full scan: an occasional maintenance read, never in the API.
  const rs = await db.execute(
    `SELECT user_id, artist_name, release_name, count(DISTINCT track_name) AS tracks, count(*) AS listens
     FROM listens WHERE release_name IS NOT NULL GROUP BY user_id, artist_name, release_name`,
  );
  type Row = { user: number; artist: string; album: string; tracks: number; listens: number };
  const groups = new Map<string, Row[]>();
  for (const r of rs.rows) {
    const row: Row = {
      user: r.user_id as number,
      artist: r.artist_name as string,
      album: r.release_name as string,
      tracks: r.tracks as number,
      listens: r.listens as number,
    };
    const key = `${row.user}\u0000${row.artist}\u0000${withoutStoreSuffixes(row.album)}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const moves: { user: number; artist: string; from: Row; to: string; kept?: Row }[] = [];
  for (const rows of groups.values()) {
    const target = withoutStoreSuffixes(rows[0]!.album);
    const kept = rows.find((r) => r.album === target);
    for (const r of rows)
      if (r.album !== target)
        moves.push({ user: r.user, artist: r.artist, from: r, to: target, kept });
  }
  if (moves.length === 0) return console.log("No album to merge.");
  for (const m of moves)
    console.log(
      `user ${m.user}  ${m.artist}: "${m.from.album}" (${m.from.tracks} tracks, ${m.from.listens} listens) → "${m.to}"` +
        (m.kept ? ` (${m.kept.tracks} tracks, ${m.kept.listens} listens)` : " (new name)"),
    );
  if (!apply) return console.log(`${moves.length} album(s) to merge. Dry run: add --apply.`);

  const backup = await db.batch(
    moves.flatMap((m) =>
      ["listens", "loved_tracks", "obsessions"].map((t) => ({
        sql: `SELECT '${t}' AS _table, * FROM ${t} WHERE user_id = ? AND artist_name = ? AND release_name IN (?, ?)`,
        args: [m.user, m.artist, m.from.album, m.to],
      })),
    ),
    "read",
  );
  const dir = join(homedir(), "stunning-winner-backups");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `albums-dedupe-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify({ moves, rows: backup.flatMap((b) => b.rows) }, null, 1));
  console.log(`backup: ${file}`);

  const out = await db.batch(
    [
      ...moves.flatMap((m) =>
        ["listens", "loved_tracks", "obsessions"].map((t) => ({
          sql: `UPDATE ${t} SET release_name = ? WHERE user_id = ? AND artist_name = ? AND release_name = ?`,
          args: [m.to, m.user, m.artist, m.from.album],
        })),
      ),
      {
        sql: `UPDATE users SET data_version = data_version + 1 WHERE id IN (${moves.map(() => "?").join(",")})`,
        args: moves.map((m) => m.user),
      },
    ],
    "write",
  );
  moves.forEach((m, i) =>
    console.log(
      `"${m.from.album}" → "${m.to}": listens ${out[i * 3]?.rowsAffected}, loved ${out[i * 3 + 1]?.rowsAffected}, obsessions ${out[i * 3 + 2]?.rowsAffected}`,
    ),
  );
}

/**
 * Artists stored under several names before the ingest rules joined them. Names are grouped when they
 * - share a spelling key ("Despo' Rutti" / "Despo Rutti", "gfriend" / "GFRIEND"),
 * - are a learned alias of each other (artist_aliases),
 * - carry the same single MusicBrainz artist id,
 * - or are a native-script name ("여자친구") whose releases title only one Latin-script artist's albums
 *   ("여자친구 The 7th Mini Album" by GFRIEND).
 * Each group keeps its most-listened name (ties: the Latin one, then the one with more capitals). Dry run unless `apply`; applying first writes
 * every affected row to ~/stunning-winner-backups, then repoints listens, loved tracks, obsessions and their
 * history, joint credits and aliases, remembers the old names as aliases, and records the spelling key of
 * every artist so new listens join the kept name.
 */
async function dedupeArtists(apply: boolean) {
  // Full scans: an occasional maintenance read, never in the API.
  const [names, albums, mbids, aliasRows] = await db.batch(
    [
      "SELECT artist_name AS name, count(*) AS n FROM listens GROUP BY artist_name",
      "SELECT DISTINCT artist_name AS artist, release_name AS album FROM listens WHERE release_name IS NOT NULL",
      "SELECT DISTINCT artist_name AS artist, artist_mbids AS mbids FROM listens WHERE artist_mbids IS NOT NULL",
      "SELECT alias, artist FROM artist_aliases",
    ],
    "read",
  );
  const count = new Map(names!.rows.map((r) => [r.name as string, r.n as number]));
  const parent = new Map<string, string>([...count.keys()].map((n) => [n, n]));
  const reasons = new Map<string, Set<string>>();
  const find = (n: string): string => {
    const p = parent.get(n)!;
    return p === n ? n : find(p);
  };
  const unite = (a: string, b: string, why: string) => {
    if (!count.has(a) || !count.has(b) || a === b) return;
    const [ra, rb] = [find(a), find(b)];
    if (ra !== rb) parent.set(ra, rb);
    for (const n of [a, b]) reasons.set(n, (reasons.get(n) ?? new Set()).add(why));
  };

  const byKey = new Map<string, string>();
  for (const n of count.keys()) {
    const k = artistKey(n);
    if (byKey.has(k)) unite(n, byKey.get(k)!, "spelling");
    else byKey.set(k, n);
  }
  for (const r of aliasRows!.rows) unite(r.alias as string, r.artist as string, "alias");
  const byMbid = new Map<string, string>();
  for (const r of mbids!.rows) {
    const ids = JSON.parse(r.mbids as string) as string[];
    if (ids.length !== 1) continue;
    const other = byMbid.get(ids[0]!);
    if (other) unite(r.artist as string, other, "MusicBrainz id");
    else byMbid.set(ids[0]!, r.artist as string);
  }
  for (const n of count.keys()) {
    if (!isNativeOnly(n)) continue;
    const latin = new Set(
      albums!.rows
        .filter((r) => r.artist !== n && isLatinOnly(r.artist as string))
        .filter((r) => albumNamedAfter(r.album as string, n))
        .map((r) => r.artist as string),
    );
    if (latin.size === 1) unite(n, [...latin][0]!, "album titles");
  }

  const groups = new Map<string, string[]>();
  for (const n of count.keys()) groups.set(find(n), [...(groups.get(find(n)) ?? []), n]);
  // Most listens; on a tie the Latin-script name, then the one with more capitals ("MEOVV" over "Meovv": a
  // stylised name is the label's, a title-cased one a service's normalisation).
  const capitals = (n: string) => n.replace(/[^\p{Lu}]/gu, "").length;
  const rank = (n: string) => [count.get(n)!, isLatinOnly(n) ? 1 : 0, capitals(n)] as const;
  const moves: { from: string; to: string; fromListens: number; toListens: number; why: string }[] =
    [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const [to] = [...group].sort((a, b) => {
      const [x, y] = [rank(a), rank(b)];
      return y[0] - x[0] || y[1] - x[1] || y[2] - x[2] || a.localeCompare(b);
    });
    for (const from of group)
      if (from !== to!)
        moves.push({
          from,
          to: to!,
          fromListens: count.get(from)!,
          toListens: count.get(to!)!,
          why: [...(reasons.get(from) ?? [])].join(", "),
        });
  }
  for (const m of moves)
    console.log(
      `"${m.from}" (${m.fromListens} listens) → "${m.to}" (${m.toListens} listens)   [${m.why}]`,
    );
  if (!apply)
    return console.log(
      `${moves.length} artist name(s) to merge, ${count.size} spelling keys to record. Dry run: add --apply.`,
    );

  const from = moves.map((m) => m.from);
  const list = JSON.stringify(from);
  const backup = await db.batch(
    [
      ...["listens", "loved_tracks", "obsessions", "obsession_history"].map((t) => ({
        sql: `SELECT '${t}' AS _table, * FROM ${t} WHERE artist_name IN (SELECT value FROM json_each(?1))`,
        args: [list],
      })),
      {
        sql: "SELECT 'artist_credits' AS _table, * FROM artist_credits WHERE credit IN (SELECT value FROM json_each(?1)) OR artist IN (SELECT value FROM json_each(?1))",
        args: [list],
      },
      {
        sql: "SELECT 'artist_aliases' AS _table, * FROM artist_aliases WHERE alias IN (SELECT value FROM json_each(?1)) OR artist IN (SELECT value FROM json_each(?1))",
        args: [list],
      },
      "SELECT 'artist_spellings' AS _table, * FROM artist_spellings",
    ],
    "read",
  );
  const dir = join(homedir(), "stunning-winner-backups");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `artists-dedupe-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify({ moves, rows: backup.flatMap((b) => b.rows) }, null, 1));
  console.log(`backup: ${file}`);

  const PER_MOVE = 11;
  const out = await db.batch(
    [
      ...moves.flatMap(({ from, to }) => [
        { sql: "UPDATE listens SET artist_name = ?2 WHERE artist_name = ?1", args: [from, to] },
        // A track loved under both names stays loved once (the row already under the kept name).
        {
          sql: "UPDATE OR IGNORE loved_tracks SET artist_name = ?2 WHERE artist_name = ?1",
          args: [from, to],
        },
        { sql: "DELETE FROM loved_tracks WHERE artist_name = ?1", args: [from] },
        { sql: "UPDATE obsessions SET artist_name = ?2 WHERE artist_name = ?1", args: [from, to] },
        {
          sql: "UPDATE obsession_history SET artist_name = ?2 WHERE artist_name = ?1",
          args: [from, to],
        },
        {
          sql: "UPDATE OR IGNORE artist_credits SET artist = ?2 WHERE artist = ?1",
          args: [from, to],
        },
        {
          sql: "UPDATE OR IGNORE artist_credits SET credit = ?2 WHERE credit = ?1",
          args: [from, to],
        },
        {
          sql: "DELETE FROM artist_credits WHERE artist = ?1 OR credit = ?1",
          args: [from],
        },
        { sql: "UPDATE artist_aliases SET artist = ?2 WHERE artist = ?1", args: [from, to] },
        {
          sql: "INSERT OR REPLACE INTO artist_aliases (alias, artist) VALUES (?1, ?2)",
          args: [from, to],
        },
        {
          sql: "INSERT OR REPLACE INTO artist_spellings (key, artist) VALUES (?1, ?2)",
          args: [artistKey(from), to],
        },
      ]),
      // Every remaining artist's key, the kept names first so they win their key.
      {
        sql: "INSERT OR REPLACE INTO artist_spellings (key, artist) SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?1)",
        args: [JSON.stringify([...new Set(moves.map((m) => m.to))].map((n) => [artistKey(n), n]))],
      },
      {
        sql: "INSERT OR IGNORE INTO artist_spellings (key, artist) SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?1)",
        args: [
          JSON.stringify(
            [...count.keys()].filter((n) => !from.includes(n)).map((n) => [artistKey(n), n]),
          ),
        ],
      },
      { sql: "UPDATE users SET data_version = data_version + 1", args: [] },
    ],
    "write",
  );
  moves.forEach((m, i) => {
    const r = out.slice(i * PER_MOVE, (i + 1) * PER_MOVE).map((x) => x.rowsAffected);
    console.log(
      `"${m.from}" → "${m.to}": listens ${r[0]}, loved ${r[1]} (+${r[2]} duplicates dropped), obsessions ${r[3]}, history ${r[4]}, credits ${r[5]! + r[6]!}`,
    );
  });
  console.log(`spelling keys recorded: ${out.at(-3)!.rowsAffected + out.at(-2)!.rowsAffected}`);
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
  case "dedupe-albums":
    await dedupeAlbums(process.argv.includes("--apply"));
    break;
  case "dedupe-artists":
    await dedupeArtists(process.argv.includes("--apply"));
    break;
  default:
    console.error(
      "usage: vpx scripts/turso.ts migrate | status | import <dump.sql> | backfill-credits",
    );
    process.exit(1);
}
db.close();
