import type { ListenRepository } from "@scrobbler/core";
import type { NewListen } from "@scrobbler/types";
import type { D1Like, D1StatementLike } from "../d1.ts";
import { jsonOrNull, LISTEN_COLUMNS, type ListenRow, toListen } from "../rows.ts";

/**
 * Max JSON bytes bound to one INSERT. D1 caps a value at 2 MB; staying well under leaves room for
 * multi-byte text. A typical 1000-listen import (~0.5 MB) fits in a single statement.
 */
const MAX_CHUNK_BYTES = 900_000;

/**
 * All listens of a request go in as one JSON parameter expanded by json_each, instead of one bound
 * parameter per column: D1 allows only 100 parameters per statement and counts every statement of a
 * batch against the per-invocation query limit, so 1000 listens cost 1 statement, not 112.
 */
const INSERT_SQL = `INSERT OR IGNORE INTO listens (${LISTEN_COLUMNS})
SELECT ?1, json_extract(j.value, '$[0]'), ?2, json_extract(j.value, '$[1]'), json_extract(j.value, '$[2]'),
       json_extract(j.value, '$[3]'), json_extract(j.value, '$[4]'), json_extract(j.value, '$[5]'),
       json_extract(j.value, '$[6]'), json_extract(j.value, '$[7]'), json_extract(j.value, '$[8]')
FROM json_each(?3) AS j`;

/** Runs right after an INSERT/DELETE in the same batch: changes() is the row count of that statement.
 * Bound JS numbers may arrive as REAL, hence the CASTs wherever they take part in arithmetic. */
const BUMP_COUNT_SQL =
  "UPDATE users SET listen_count = max(listen_count + CAST(?2 AS INTEGER) * changes(), 0) WHERE id = ?1";

function toTuple(l: NewListen): unknown[] {
  return [
    l.listenedAt,
    l.recordingMsid,
    l.artistName,
    l.trackName,
    l.releaseName,
    l.recordingMbid,
    l.releaseMbid,
    jsonOrNull(l.artistMbids),
    jsonOrNull(l.additionalInfo),
  ];
}

export function chunkBySize(tuples: unknown[][], maxBytes = MAX_CHUNK_BYTES): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let size = 2;
  for (const t of tuples) {
    const json = JSON.stringify(t);
    if (current.length > 0 && size + json.length + 1 > maxBytes) {
      chunks.push(`[${current.join(",")}]`);
      current = [];
      size = 2;
    }
    current.push(json);
    size += json.length + 1;
  }
  if (current.length > 0) chunks.push(`[${current.join(",")}]`);
  return chunks;
}

export function d1Listens(db: D1Like): ListenRepository {
  return {
    async insertMany(userId, listens, insertedAt) {
      if (listens.length === 0) return 0;
      const statements: D1StatementLike[] = [];
      for (const chunk of chunkBySize(listens.map(toTuple))) {
        statements.push(db.prepare(INSERT_SQL).bind(userId, insertedAt, chunk));
        statements.push(db.prepare(BUMP_COUNT_SQL).bind(userId, 1));
      }
      const results = await db.batch(statements);
      return results.filter((_, i) => i % 2 === 0).reduce((n, r) => n + r.meta.changes, 0);
    },

    async page({ userId, minTs, maxTs, limit }) {
      const where = ["user_id = ?1"];
      const params: unknown[] = [userId];
      if (maxTs !== undefined) {
        params.push(maxTs);
        where.push(`listened_at < ?${params.length}`);
      }
      if (minTs !== undefined) {
        params.push(minTs);
        where.push(`listened_at > ?${params.length}`);
      }
      params.push(limit);
      const base = `SELECT ${LISTEN_COLUMNS}, id FROM listens WHERE ${where.join(" AND ")}`;
      // With only min_ts, take the listens just after it, then present them newest first.
      const list =
        minTs !== undefined && maxTs === undefined
          ? `SELECT * FROM (${base} ORDER BY listened_at ASC, id ASC LIMIT ?${params.length}) ORDER BY listened_at DESC, id DESC`
          : `${base} ORDER BY listened_at DESC, id DESC LIMIT ?${params.length}`;
      // Two single-aggregate subqueries so SQLite answers each with one index seek.
      const bounds =
        "SELECT (SELECT min(listened_at) FROM listens WHERE user_id = ?1) AS oldest, (SELECT max(listened_at) FROM listens WHERE user_id = ?1) AS latest";

      const [rows, edges] = await db.batch([
        db.prepare(list).bind(...params),
        db.prepare(bounds).bind(userId),
      ]);
      const edge = (edges?.results[0] ?? {}) as { oldest?: number | null; latest?: number | null };
      return {
        listens: ((rows?.results ?? []) as ListenRow[]).map(toListen),
        oldestListenTs: edge.oldest ?? null,
        latestListenTs: edge.latest ?? null,
      };
    },

    async delete(userId, listenedAt, recordingMsid) {
      const [del] = await db.batch([
        db
          .prepare(
            "DELETE FROM listens WHERE user_id = ?1 AND listened_at = ?2 AND recording_msid = ?3",
          )
          .bind(userId, listenedAt, recordingMsid),
        db.prepare(BUMP_COUNT_SQL).bind(userId, -1),
      ]);
      return (del?.meta.changes ?? 0) > 0;
    },
  };
}
