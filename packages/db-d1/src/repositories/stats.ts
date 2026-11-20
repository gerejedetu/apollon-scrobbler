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
        db.prepare(`SELECT count(*) AS n FROM (SELECT 1 FROM listens ${where} GROUP BY ${e.group})`).bind(userId, window.fromTs, window.toTs),
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
  };
}
