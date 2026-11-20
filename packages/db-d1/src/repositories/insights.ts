/**
 * SQL for the extended statistics. Every method is one statement or one batch (one round trip), and every
 * statement is bounded by an index on (user_id, listened_at, ...) or (user_id, artist_name, listened_at).
 *
 * Bound JS numbers can arrive as REAL, so offsets used in arithmetic are CAST to INTEGER: otherwise
 * `/ 86400` would not be an integer division.
 */
import type { InsightsRepository } from "@scrobbler/core";
import type { Bucket, EntityKey, InsightEntity } from "@scrobbler/types";
import type { D1Like } from "../d1.ts";

/** Local time of a listen, given the offset bound at `?${n}`. */
const local = (n: number) => `(listened_at + CAST(?${n} AS INTEGER))`;

function bucketExpr(bucket: Exclude<Bucket, "hour_weekday">, t: string): string {
  switch (bucket) {
    case "hour":
      return `(${t} / 3600) % 24`;
    case "weekday":
      // 1970-01-01 was a Thursday: +3 makes Monday 0.
      return `((${t} / 86400) + 3) % 7`;
    case "day":
      return `${t} / 86400`;
    case "week":
      return `((${t} / 86400) + 3) / 7`;
    case "month":
      return `strftime('%Y-%m', ${t}, 'unixepoch')`;
    case "year":
      return `strftime('%Y', ${t}, 'unixepoch')`;
  }
}

interface EntitySql {
  cols: string;
  group: string;
  filter: string;
}

const ENTITY: Record<InsightEntity, EntitySql> = {
  artists: {
    cols: "artist_name, NULL AS track_name, NULL AS release_name",
    group: "artist_name",
    filter: "",
  },
  recordings: {
    cols: "artist_name, track_name, max(release_name) AS release_name",
    group: "artist_name, track_name",
    filter: "",
  },
  releases: {
    cols: "artist_name, NULL AS track_name, release_name",
    group: "artist_name, release_name",
    filter: " AND release_name IS NOT NULL",
  },
};

interface Row {
  artist_name: string;
  track_name: string | null;
  release_name: string | null;
  listen_count: number;
}

function toKey(r: Row) {
  return {
    artistName: r.artist_name,
    trackName: r.track_name ?? null,
    releaseName: r.release_name ?? null,
  };
}

/** WHERE fragment for one artist / track / album, with its parameters appended to `params`. */
function keyFilter(key: EntityKey, params: unknown[]): string {
  params.push(key.artistName);
  let sql = ` AND artist_name = ?${params.length}`;
  if (key.trackName) {
    params.push(key.trackName);
    sql += ` AND track_name = ?${params.length}`;
  }
  if (key.releaseName) {
    params.push(key.releaseName);
    sql += ` AND release_name = ?${params.length}`;
  }
  return sql;
}

const WINDOW = "user_id = ?1 AND listened_at BETWEEN ?2 AND ?3";

export function d1Insights(db: D1Like): InsightsRepository {
  const all = async <T>(sql: string, ...params: unknown[]) =>
    (
      await db
        .prepare(sql)
        .bind(...params)
        .all<T>()
    ).results;

  return {
    async histogram({ userId, window, utcOffsetSeconds, bucket }) {
      const t = local(4);
      if (bucket === "hour_weekday") {
        const rows = await all<{ key: number; hour: number; listen_count: number }>(
          `SELECT ${bucketExpr("weekday", t)} AS key, ${bucketExpr("hour", t)} AS hour, count(*) AS listen_count
           FROM listens WHERE ${WINDOW} GROUP BY key, hour ORDER BY key, hour`,
          userId,
          window.fromTs,
          window.toTs,
          utcOffsetSeconds,
        );
        return rows.map((r) => ({ key: r.key, hour: r.hour, listenCount: r.listen_count }));
      }
      const rows = await all<{ key: number | string; listen_count: number }>(
        `SELECT ${bucketExpr(bucket, t)} AS key, count(*) AS listen_count FROM listens WHERE ${WINDOW} GROUP BY key ORDER BY key`,
        userId,
        window.fromTs,
        window.toTs,
        utcOffsetSeconds,
      );
      return rows.map((r) => ({ key: r.key, listenCount: r.listen_count }));
    },

    async listeningDays({ userId, window, utcOffsetSeconds }) {
      const rows = await all<{ d: number }>(
        `SELECT DISTINCT ${local(4)} / 86400 AS d FROM listens WHERE ${WINDOW} ORDER BY d`,
        userId,
        window.fromTs,
        window.toTs,
        utcOffsetSeconds,
      );
      return rows.map((r) => r.d);
    },

    async duration({ userId, window }) {
      const ms =
        "coalesce(json_extract(additional_info, '$.duration_ms'), json_extract(additional_info, '$.duration') * 1000)";
      const [row] = await all<{ total: number | null; n: number }>(
        `SELECT sum(${ms}) AS total, count(${ms}) AS n FROM listens WHERE ${WINDOW} AND additional_info IS NOT NULL`,
        userId,
        window.fromTs,
        window.toTs,
      );
      return { totalMs: Math.round(row?.total ?? 0), listensWithDuration: row?.n ?? 0 };
    },

    async discoveries({ userId, window, entity, limit }) {
      const e = ENTITY[entity];
      const rows = await all<Row & { first: number; total: number }>(
        `WITH firsts AS (
           SELECT ${e.cols}, min(listened_at) AS first, count(*) AS listen_count
           FROM listens WHERE user_id = ?1${e.filter} GROUP BY ${e.group}
         )
         SELECT *, (SELECT count(*) FROM firsts WHERE first BETWEEN ?2 AND ?3) AS total
         FROM firsts WHERE first BETWEEN ?2 AND ?3 ORDER BY listen_count DESC, first LIMIT ?4`,
        userId,
        window.fromTs,
        window.toTs,
        limit,
      );
      return {
        total: rows[0]?.total ?? 0,
        items: rows.map((r) => ({
          ...toKey(r),
          listenCount: r.listen_count,
          firstListenedAt: r.first,
        })),
      };
    },

    async forgotten({ userId, entity, before, minListens, limit }) {
      const e = ENTITY[entity];
      const rows = await all<Row & { last: number }>(
        `SELECT ${e.cols}, count(*) AS listen_count, max(listened_at) AS last
         FROM listens WHERE user_id = ?1${e.filter} GROUP BY ${e.group}
         HAVING last < ?2 AND listen_count >= ?3 ORDER BY listen_count DESC LIMIT ?4`,
        userId,
        before,
        minListens,
        limit,
      );
      return rows.map((r) => ({
        ...toKey(r),
        listenCount: r.listen_count,
        lastListenedAt: r.last,
      }));
    },

    async compare({ userId, entity, current, previous, limit, order }) {
      const e = ENTITY[entity];
      const by = {
        rising: "change DESC, cur DESC",
        falling: "change ASC, prev DESC",
        current: "cur DESC, change DESC",
      }[order];
      const rows = await all<Row & { cur: number; prev: number; change: number }>(
        `SELECT ${e.cols}, sum(listened_at >= ?4) AS cur, sum(listened_at <= ?3) AS prev,
                sum(listened_at >= ?4) - sum(listened_at <= ?3) AS change, 0 AS listen_count
         FROM listens WHERE user_id = ?1 AND listened_at BETWEEN ?2 AND ?5${e.filter}
         GROUP BY ${e.group} ORDER BY ${by}, ${e.group} LIMIT ?6`,
        userId,
        previous.fromTs,
        previous.toTs,
        current.fromTs,
        current.toTs,
        limit,
      );
      return rows.map((r) => ({ ...toKey(r), current: r.cur, previous: r.prev, change: r.change }));
    },

    async oneShots({ userId, window, limit }) {
      const rows = await all<Row & { last: number; total: number }>(
        `WITH t AS (
           SELECT artist_name, track_name, max(release_name) AS release_name, count(*) AS listen_count, max(listened_at) AS last
           FROM listens WHERE ${WINDOW} GROUP BY artist_name, track_name
         )
         SELECT *, (SELECT count(*) FROM t WHERE listen_count = 1) AS total
         FROM t WHERE listen_count = 1 ORDER BY last DESC LIMIT ?4`,
        userId,
        window.fromTs,
        window.toTs,
        limit,
      );
      return {
        total: rows[0]?.total ?? 0,
        items: rows.map((r) => ({ ...toKey(r), listenCount: 1 })),
      };
    },

    async entity({ userId, window, key }) {
      const params: unknown[] = [userId, window.fromTs, window.toTs];
      const filter = keyFilter(key, params);
      const [row] = await all<{ n: number; first: number | null; last: number | null }>(
        `SELECT count(*) AS n, min(listened_at) AS first, max(listened_at) AS last FROM listens WHERE ${WINDOW}${filter}`,
        ...params,
      );
      if (!row || row.n === 0) return null;
      return { listenCount: row.n, firstListenedAt: row.first, lastListenedAt: row.last };
    },

    async albumTracks({ userId, window, key }) {
      const params: unknown[] = [userId, window.fromTs, window.toTs];
      const filter = keyFilter(key, params);
      const rows = await all<{ track_name: string; n: number; first: number; last: number }>(
        `SELECT track_name, count(*) AS n, min(listened_at) AS first, max(listened_at) AS last
         FROM listens WHERE ${WINDOW}${filter} GROUP BY track_name ORDER BY n DESC, track_name`,
        ...params,
      );
      return rows.map((r) => ({
        trackName: r.track_name,
        listenCount: r.n,
        firstListenedAt: r.first,
        lastListenedAt: r.last,
      }));
    },

    async timeline({ userId, window, utcOffsetSeconds, key, bucket }) {
      const params: unknown[] = [userId, window.fromTs, window.toTs, utcOffsetSeconds];
      const filter = key ? keyFilter(key, params) : "";
      const rows = await all<{ key: number | string; listen_count: number }>(
        `SELECT ${bucketExpr(bucket, local(4))} AS key, count(*) AS listen_count
         FROM listens WHERE ${WINDOW}${filter} GROUP BY key ORDER BY key`,
        ...params,
      );
      return rows.map((r) => ({ key: r.key, listenCount: r.listen_count }));
    },

    async chart({ userId, window, utcOffsetSeconds, entity, bucket, limit }) {
      const e = ENTITY[entity];
      const period = bucketExpr(bucket, local(4));
      const rows = await all<Row & { period: number | string; rk: number }>(
        `SELECT * FROM (
           SELECT ${period} AS period, ${e.cols}, count(*) AS listen_count,
                  row_number() OVER (PARTITION BY ${period} ORDER BY count(*) DESC, ${e.group}) AS rk
           FROM listens WHERE ${WINDOW}${e.filter} GROUP BY period, ${e.group}
         ) WHERE rk <= ?5 ORDER BY period, rk`,
        userId,
        window.fromTs,
        window.toTs,
        utcOffsetSeconds,
        limit,
      );
      return rows.map((r) => ({
        ...toKey(r),
        period: String(r.period),
        rank: r.rk,
        listenCount: r.listen_count,
      }));
    },

    async diversity({ userId, window }) {
      const [row] = await all<{
        listens: number | null;
        artists: number;
        top10: number | null;
        top: number | null;
      }>(
        `WITH a AS (SELECT artist_name, count(*) AS c FROM listens WHERE ${WINDOW} GROUP BY artist_name)
         SELECT (SELECT sum(c) FROM a) AS listens, (SELECT count(*) FROM a) AS artists,
                (SELECT sum(c) FROM (SELECT c FROM a ORDER BY c DESC LIMIT 10)) AS top10,
                (SELECT max(c) FROM a) AS top`,
        userId,
        window.fromTs,
        window.toTs,
      );
      return {
        listenCount: row?.listens ?? 0,
        artistCount: row?.artists ?? 0,
        top10ArtistListens: row?.top10 ?? 0,
        topArtistListens: row?.top ?? 0,
      };
    },

    async sessions({ userId, window, gapSeconds }) {
      const [row] = await all<{
        cnt: number;
        avg_n: number | null;
        avg_d: number | null;
        n: number | null;
        a: number | null;
        b: number | null;
      }>(
        `WITH g AS (
           SELECT listened_at, id,
                  CASE WHEN lag(listened_at) OVER w IS NULL OR listened_at - lag(listened_at) OVER w > CAST(?4 AS INTEGER) THEN 1 ELSE 0 END AS starts
           FROM listens WHERE ${WINDOW} WINDOW w AS (ORDER BY listened_at, id)
         ),
         s AS (SELECT listened_at, sum(starts) OVER (ORDER BY listened_at, id ROWS UNBOUNDED PRECEDING) AS sid FROM g),
         agg AS (SELECT sid, count(*) AS n, min(listened_at) AS a, max(listened_at) AS b FROM s GROUP BY sid)
         SELECT (SELECT count(*) FROM agg) AS cnt, (SELECT avg(n) FROM agg) AS avg_n, (SELECT avg(b - a) FROM agg) AS avg_d,
                n, a, b
         FROM (SELECT 1) LEFT JOIN (SELECT n, a, b FROM agg ORDER BY n DESC, b - a DESC LIMIT 1) ON 1`,
        userId,
        window.fromTs,
        window.toTs,
        gapSeconds,
      );
      return {
        sessionCount: row?.cnt ?? 0,
        averageListens: Math.round((row?.avg_n ?? 0) * 10) / 10,
        averageDurationSeconds: Math.round(row?.avg_d ?? 0),
        longest: row?.n ? { listenCount: row.n, startedAt: row.a!, endedAt: row.b! } : null,
      };
    },

    async repeats({ userId, window, limit }) {
      const rows = await all<{ artist_name: string; track_name: string; n: number; start: number }>(
        `WITH o AS (
           SELECT listened_at, id, artist_name, track_name,
                  CASE WHEN artist_name = lag(artist_name) OVER w AND track_name = lag(track_name) OVER w THEN 0 ELSE 1 END AS brk
           FROM listens WHERE ${WINDOW} WINDOW w AS (ORDER BY listened_at, id)
         ),
         r AS (SELECT *, sum(brk) OVER (ORDER BY listened_at, id ROWS UNBOUNDED PRECEDING) AS run FROM o),
         runs AS (SELECT artist_name, track_name, count(*) AS n, min(listened_at) AS start FROM r GROUP BY run HAVING n >= 2),
         best AS (SELECT *, row_number() OVER (PARTITION BY artist_name, track_name ORDER BY n DESC, start) AS rn FROM runs)
         SELECT artist_name, track_name, n, start FROM best WHERE rn = 1 ORDER BY n DESC, start DESC LIMIT ?4`,
        userId,
        window.fromTs,
        window.toTs,
        limit,
      );
      return rows.map((r) => ({
        artistName: r.artist_name,
        trackName: r.track_name,
        longestRun: r.n,
        startedAt: r.start,
      }));
    },

    async milestones({ userId, ns }) {
      if (ns.length === 0) return [];
      const results = await db.batch(
        ns.map((n) =>
          db
            .prepare(
              "SELECT listened_at, artist_name, track_name, release_name FROM listens WHERE user_id = ?1 ORDER BY listened_at, id LIMIT 1 OFFSET ?2",
            )
            .bind(userId, n - 1),
        ),
      );
      return ns.flatMap((n, i) => {
        const r = results[i]?.results[0] as
          | {
              listened_at: number;
              artist_name: string;
              track_name: string;
              release_name: string | null;
            }
          | undefined;
        return r
          ? [
              {
                n,
                listenedAt: r.listened_at,
                artistName: r.artist_name,
                trackName: r.track_name,
                releaseName: r.release_name,
              },
            ]
          : [];
      });
    },

    async topInWindows({ userId, windows, limit }) {
      if (windows.length === 0) return [];
      const results = await db.batch(
        windows.map((w) =>
          db
            .prepare(
              `SELECT artist_name, track_name, max(release_name) AS release_name, count(*) AS listen_count, sum(count(*)) OVER () AS total
               FROM listens WHERE ${WINDOW} GROUP BY artist_name, track_name ORDER BY listen_count DESC, artist_name LIMIT ?4`,
            )
            .bind(userId, w.fromTs, w.toTs, limit),
        ),
      );
      return results.map((res) => {
        const rows = res.results as (Row & { total: number })[];
        return {
          listenCount: rows[0]?.total ?? 0,
          items: rows.map((r) => ({ ...toKey(r), listenCount: r.listen_count })),
        };
      });
    },
  };
}
