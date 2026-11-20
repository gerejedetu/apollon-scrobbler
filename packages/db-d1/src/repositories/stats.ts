import type { StatsRepository } from "@scrobbler/core";
import type { StatsEntity, TopRow } from "@scrobbler/types";
import type { D1Like } from "../d1.ts";
import { parseJson } from "../rows.ts";

interface EntitySql {
  /** Extra columns besides artist_name and the count. */
  select: string;
  group: string;
  filter: string;
}

const ENTITIES: Record<StatsEntity, EntitySql> = {
  artists: { select: "max(artist_mbids) AS artist_mbids", group: "artist_name", filter: "" },
  recordings: {
    select:
      "track_name, max(release_name) AS release_name, max(recording_mbid) AS recording_mbid, max(release_mbid) AS release_mbid, max(artist_mbids) AS artist_mbids",
    group: "artist_name, track_name",
    filter: "",
  },
  releases: {
    select: "release_name, max(release_mbid) AS release_mbid, max(artist_mbids) AS artist_mbids",
    group: "artist_name, release_name",
    filter: " AND release_name IS NOT NULL",
  },
};

interface StatsRow {
  artist_name: string;
  artist_mbids: string | null;
  track_name?: string | null;
  release_name?: string | null;
  recording_mbid?: string | null;
  release_mbid?: string | null;
  listen_count: number;
}

export function d1Stats(db: D1Like): StatsRepository {
  return {
    async top({ userId, entity, window, limit, offset }) {
      const e = ENTITIES[entity];
      // The (user_id, listened_at, ...) index bounds the scan to the window.
      const where = `WHERE user_id = ?1 AND listened_at BETWEEN ?2 AND ?3${e.filter}`;
      const [rows, total] = await db.batch([
        db
          .prepare(
            `SELECT artist_name, ${e.select}, count(*) AS listen_count FROM listens ${where} GROUP BY ${e.group} ORDER BY listen_count DESC, ${e.group} LIMIT ?4 OFFSET ?5`,
          )
          .bind(userId, window.fromTs, window.toTs, limit, offset),
        db
          .prepare(`SELECT count(*) AS n FROM (SELECT 1 FROM listens ${where} GROUP BY ${e.group})`)
          .bind(userId, window.fromTs, window.toTs),
      ]);
      const out: TopRow[] = ((rows?.results ?? []) as StatsRow[]).map((r) => ({
        artistName: r.artist_name,
        artistMbids: parseJson<string[]>(r.artist_mbids, []),
        trackName: r.track_name ?? null,
        releaseName: r.release_name ?? null,
        recordingMbid: r.recording_mbid ?? null,
        releaseMbid: r.release_mbid ?? null,
        listenCount: r.listen_count,
      }));
      return { rows: out, total: ((total?.results[0] ?? { n: 0 }) as { n: number }).n };
    },

    async activity({ userId, window, utcOffsetSeconds }) {
      const { results } = await db
        .prepare(
          "SELECT (listened_at + CAST(?4 AS INTEGER)) / 86400 AS day, count(*) AS listen_count FROM listens WHERE user_id = ?1 AND listened_at BETWEEN ?2 AND ?3 GROUP BY day ORDER BY day",
        )
        .bind(userId, window.fromTs, window.toTs, utcOffsetSeconds)
        .all<{ day: number; listen_count: number }>();
      return results.map((r) => ({ day: r.day, listenCount: r.listen_count }));
    },

    async summary(userId, window) {
      // One pass over the window; the composite key separates artist and title with a NUL character.
      const row = await db
        .prepare(
          `SELECT count(*) AS listens, count(DISTINCT artist_name) AS artists,
                  count(DISTINCT artist_name || char(0) || track_name) AS recordings,
                  count(DISTINCT artist_name || char(0) || release_name) AS releases,
                  min(listened_at) AS first, max(listened_at) AS last
           FROM listens WHERE user_id = ?1 AND listened_at BETWEEN ?2 AND ?3`,
        )
        .bind(userId, window.fromTs, window.toTs)
        .first<{
          listens: number;
          artists: number;
          recordings: number;
          releases: number;
          first: number | null;
          last: number | null;
        }>();
      return {
        listenCount: row?.listens ?? 0,
        artistCount: row?.artists ?? 0,
        recordingCount: row?.recordings ?? 0,
        releaseCount: row?.releases ?? 0,
        firstListenedAt: row?.first ?? null,
        lastListenedAt: row?.last ?? null,
      };
    },

    async artist({ userId, artistName, window, limit }) {
      // All three statements are bounded by the (user_id, artist_name, listened_at) index.
      const where = "WHERE user_id = ?1 AND artist_name = ?2 AND listened_at BETWEEN ?3 AND ?4";
      const [head, tracks, albums] = await db.batch([
        db
          .prepare(
            `SELECT count(*) AS listens, count(DISTINCT track_name) AS tracks, count(DISTINCT release_name) AS albums, min(listened_at) AS first, max(listened_at) AS last, max(artist_mbids) AS artist_mbids FROM listens ${where}`,
          )
          .bind(userId, artistName, window.fromTs, window.toTs),
        db
          .prepare(
            `SELECT track_name, max(release_name) AS release_name, max(recording_mbid) AS recording_mbid, count(*) AS listen_count FROM listens ${where} GROUP BY track_name ORDER BY listen_count DESC, track_name LIMIT ?5`,
          )
          .bind(userId, artistName, window.fromTs, window.toTs, limit),
        db
          .prepare(
            `SELECT release_name, max(release_mbid) AS release_mbid, count(*) AS listen_count, count(DISTINCT track_name) AS tracks, min(listened_at) AS first, max(listened_at) AS last FROM listens ${where} AND release_name IS NOT NULL GROUP BY release_name ORDER BY listen_count DESC, release_name LIMIT ?5`,
          )
          .bind(userId, artistName, window.fromTs, window.toTs, limit),
      ]);
      const h = head?.results[0] as
        | {
            listens: number;
            tracks: number;
            albums: number;
            first: number | null;
            last: number | null;
            artist_mbids: string | null;
          }
        | undefined;
      if (!h || h.listens === 0) return null;
      const rows = (tracks?.results ?? []) as {
        track_name: string;
        release_name: string | null;
        recording_mbid: string | null;
        listen_count: number;
      }[];
      return {
        artistName,
        artistMbids: parseJson<string[]>(h.artist_mbids, []),
        listenCount: h.listens,
        trackCount: h.tracks,
        albumCount: h.albums,
        firstListenedAt: h.first,
        lastListenedAt: h.last,
        topTracks: rows.map((r) => ({
          trackName: r.track_name,
          releaseName: r.release_name,
          recordingMbid: r.recording_mbid,
          listenCount: r.listen_count,
        })),
        albums: (
          (albums?.results ?? []) as {
            release_name: string;
            release_mbid: string | null;
            listen_count: number;
            tracks: number;
            first: number;
            last: number;
          }[]
        ).map((a) => ({
          releaseName: a.release_name,
          releaseMbid: a.release_mbid,
          listenCount: a.listen_count,
          trackCount: a.tracks,
          firstListenedAt: a.first,
          lastListenedAt: a.last,
        })),
      };
    },
  };
}
