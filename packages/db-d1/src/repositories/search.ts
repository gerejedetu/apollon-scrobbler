import type { SearchRepository } from "@scrobbler/core";
import type { D1Like } from "../d1.ts";

/** `text` as a LIKE pattern with %, _ and \\ escaped. */
const literal = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Three statements, one round trip. Each reads only this user's listens (index prefix user_id); names that
 * start with the text rank first, then the most listened.
 */
export function d1Search(db: D1Like): SearchRepository {
  return {
    async search(userId, text, limit) {
      const anywhere = `%${literal(text)}%`;
      const prefix = `${literal(text)}%`;
      const where = (column: string) => `user_id = ?1 AND ${column} LIKE ?2 ESCAPE '\\'`;
      const rank = (column: string) => `(${column} LIKE ?3 ESCAPE '\\') DESC, listen_count DESC`;
      const [artists, albums, tracks] = await db.batch([
        db
          .prepare(
            `SELECT artist_name, count(*) AS listen_count FROM listens WHERE ${where("artist_name")}
             GROUP BY artist_name ORDER BY ${rank("artist_name")}, artist_name LIMIT ?4`,
          )
          .bind(userId, anywhere, prefix, limit),
        db
          .prepare(
            `SELECT artist_name, release_name, max(release_mbid) AS release_mbid, count(*) AS listen_count
             FROM listens WHERE ${where("release_name")}
             GROUP BY artist_name, release_name ORDER BY ${rank("release_name")}, release_name LIMIT ?4`,
          )
          .bind(userId, anywhere, prefix, limit),
        db
          .prepare(
            `SELECT artist_name, track_name, max(release_name) AS release_name, max(release_mbid) AS release_mbid,
                    count(*) AS listen_count
             FROM listens WHERE ${where("track_name")}
             GROUP BY artist_name, track_name ORDER BY ${rank("track_name")}, track_name LIMIT ?4`,
          )
          .bind(userId, anywhere, prefix, limit),
      ]);
      type Row = {
        artist_name: string;
        release_name?: string | null;
        track_name?: string;
        release_mbid?: string | null;
        listen_count: number;
      };
      const rows = (r: typeof artists) => (r?.results ?? []) as Row[];
      return {
        artists: rows(artists).map((r) => ({
          artistName: r.artist_name,
          listenCount: r.listen_count,
        })),
        albums: rows(albums).map((r) => ({
          artistName: r.artist_name,
          releaseName: r.release_name ?? "",
          releaseMbid: r.release_mbid ?? null,
          listenCount: r.listen_count,
        })),
        tracks: rows(tracks).map((r) => ({
          artistName: r.artist_name,
          trackName: r.track_name ?? "",
          releaseName: r.release_name ?? null,
          releaseMbid: r.release_mbid ?? null,
          listenCount: r.listen_count,
        })),
      };
    },
  };
}
