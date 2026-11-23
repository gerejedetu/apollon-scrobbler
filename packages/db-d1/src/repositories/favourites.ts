import type { FavouriteRepository } from "@scrobbler/core";
import type { FavouriteTrack } from "@scrobbler/types";
import type { D1Like } from "../d1.ts";

interface Row {
  artist_name: string;
  track_name: string;
  release_name: string | null;
  recording_mbid: string | null;
  release_mbid: string | null;
  at: number;
}

const COLUMNS = "artist_name, track_name, release_name, recording_mbid, release_mbid";
/** An obsession kept less than this was a misclick: it is not recorded in the history. */
const MIN_PERIOD_SECONDS = 60;
/** Setting the previous obsession again within this time continues its period instead of opening one. */
const RESUME_WITHIN_SECONDS = 600;

const toTrack = (r: Row): FavouriteTrack => ({
  artistName: r.artist_name,
  trackName: r.track_name,
  releaseName: r.release_name,
  recordingMbid: r.recording_mbid,
  releaseMbid: r.release_mbid,
  at: r.at,
});

const values = (t: FavouriteTrack) => [
  t.artistName,
  t.trackName,
  t.releaseName,
  t.recordingMbid,
  t.releaseMbid,
  t.at,
];

export function d1Favourites(db: D1Like): FavouriteRepository {
  return {
    async love(userId, t) {
      await db
        .prepare(
          `INSERT INTO loved_tracks (user_id, ${COLUMNS}, loved_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
           ON CONFLICT (user_id, artist_name, track_name) DO UPDATE SET
             release_name = coalesce(excluded.release_name, release_name),
             recording_mbid = coalesce(excluded.recording_mbid, recording_mbid),
             release_mbid = coalesce(excluded.release_mbid, release_mbid)`,
        )
        .bind(userId, ...values(t))
        .run();
    },

    async unlove(userId, artistName, trackName) {
      await db
        .prepare(
          "DELETE FROM loved_tracks WHERE user_id = ?1 AND artist_name = ?2 AND track_name = ?3",
        )
        .bind(userId, artistName, trackName)
        .run();
    },

    async loved(userId, limit, offset) {
      // One round trip: the page (index on user_id, loved_at) and the total (primary key prefix).
      const [rows, total] = await db.batch([
        db
          .prepare(
            `SELECT ${COLUMNS}, loved_at AS at FROM loved_tracks WHERE user_id = ?1 ORDER BY loved_at DESC, artist_name, track_name LIMIT ?2 OFFSET ?3`,
          )
          .bind(userId, limit, offset),
        db.prepare("SELECT count(*) AS n FROM loved_tracks WHERE user_id = ?1").bind(userId),
      ]);
      return {
        items: ((rows?.results ?? []) as Row[]).map(toTrack),
        total: ((total?.results[0] ?? { n: 0 }) as { n: number }).n,
      };
    },

    async setObsession(userId, t, at) {
      // Setting the same track again keeps its period open (no new history row).
      const same = t
        ? await db
            .prepare(
              "SELECT 1 AS same FROM obsessions WHERE user_id = ?1 AND artist_name = ?2 AND track_name = ?3",
            )
            .bind(userId, t.artistName, t.trackName)
            .first<{ same: number }>()
        : null;
      // Closing a period: one that lasted under a minute was a misclick and leaves no trace.
      const dropShort = db
        .prepare(
          `DELETE FROM obsession_history WHERE user_id = ?1 AND ended_at IS NULL AND ?2 - started_at < ${MIN_PERIOD_SECONDS}`,
        )
        .bind(userId, at);
      const close = db
        .prepare(
          "UPDATE obsession_history SET ended_at = ?2 WHERE user_id = ?1 AND ended_at IS NULL",
        )
        .bind(userId, at);
      if (!t) {
        await db.batch([
          db.prepare("DELETE FROM obsessions WHERE user_id = ?1").bind(userId),
          dropShort,
          close,
        ]);
        return;
      }
      const set = db
        .prepare(
          `INSERT OR REPLACE INTO obsessions (user_id, ${COLUMNS}, set_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(userId, ...values(t));
      if (same) {
        await set.run();
        return;
      }
      await db.batch([
        dropShort,
        close,
        set,
        // Coming back to the track of the latest period soon after leaving it continues that period.
        db
          .prepare(
            `UPDATE obsession_history SET ended_at = NULL
             WHERE id = (SELECT id FROM obsession_history WHERE user_id = ?1 ORDER BY started_at DESC, id DESC LIMIT 1)
               AND artist_name = ?2 AND track_name = ?3 AND ended_at >= ?4 - ${RESUME_WITHIN_SECONDS}`,
          )
          .bind(userId, t.artistName, t.trackName, at),
        // Otherwise a new period (changes() is the row count of the statement just above).
        db
          .prepare(
            `INSERT INTO obsession_history (user_id, ${COLUMNS}, started_at)
             SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7 WHERE changes() = 0`,
          )
          .bind(userId, ...values(t)),
      ]);
    },

    async deleteObsessionPeriod(userId, id) {
      const res = await db
        .prepare("DELETE FROM obsession_history WHERE user_id = ?1 AND id = ?2")
        .bind(userId, id)
        .run();
      return res.meta.changes > 0;
    },

    async obsessionHistory(userId, limit, offset, now) {
      const [rows, total, longest] = await db.batch([
        db
          .prepare(
            `SELECT id, ${COLUMNS}, started_at AS at, ended_at FROM obsession_history WHERE user_id = ?1
             ORDER BY started_at DESC, id DESC LIMIT ?2 OFFSET ?3`,
          )
          .bind(userId, limit, offset),
        db.prepare("SELECT count(*) AS n FROM obsession_history WHERE user_id = ?1").bind(userId),
        db
          .prepare(
            `SELECT id, ${COLUMNS}, started_at AS at, ended_at FROM obsession_history WHERE user_id = ?1
             ORDER BY coalesce(ended_at, ?2) - started_at DESC, started_at DESC LIMIT 1`,
          )
          .bind(userId, now),
      ]);
      const top = (longest?.results[0] ?? null) as
        | (Row & { id: number; ended_at: number | null })
        | null;
      return {
        items: ((rows?.results ?? []) as (Row & { id: number; ended_at: number | null })[]).map(
          (r) => ({
            ...toTrack(r),
            id: r.id,
            endedAt: r.ended_at,
          }),
        ),
        total: ((total?.results[0] ?? { n: 0 }) as { n: number }).n,
        longest: top ? { ...toTrack(top), id: top.id, endedAt: top.ended_at } : null,
      };
    },

    async obsession(userId) {
      const row = await db
        .prepare(`SELECT ${COLUMNS}, set_at AS at FROM obsessions WHERE user_id = ?1`)
        .bind(userId)
        .first<Row>();
      return row ? toTrack(row) : null;
    },
  };
}
