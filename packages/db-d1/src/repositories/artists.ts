import type { ArtistRepository } from "@scrobbler/core";
import type { D1Like } from "../d1.ts";

export function d1Artists(db: D1Like): ArtistRepository {
  return {
    async known(userId, names) {
      if (names.length === 0) return new Set();
      // One seek per name on (user_id, artist_name, listened_at): EXISTS stops at the first row.
      const { results } = await db
        .prepare(
          `SELECT n.value AS name FROM json_each(?2) AS n
           WHERE EXISTS (SELECT 1 FROM listens WHERE user_id = ?1 AND artist_name = n.value)`,
        )
        .bind(userId, JSON.stringify(names))
        .all<{ name: string }>();
      return new Set(results.map((r) => r.name));
    },
    async aliases(names) {
      if (names.length === 0) return new Map();
      const { results } = await db
        .prepare(
          "SELECT alias, artist FROM artist_aliases WHERE alias IN (SELECT value FROM json_each(?1))",
        )
        .bind(JSON.stringify(names))
        .all<{ alias: string; artist: string }>();
      return new Map(results.map((r) => [r.alias, r.artist]));
    },
    async learnAliases(pairs) {
      if (pairs.length === 0) return;
      // First form learned wins: an alias never moves to another artist on its own.
      await db
        .prepare(
          "INSERT OR IGNORE INTO artist_aliases (alias, artist) SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?1)",
        )
        .bind(JSON.stringify(pairs))
        .run();
    },
    async knownAlbums(userId, pairs) {
      if (pairs.length === 0) return new Set();
      // Each pair seeks (user_id, artist_name, ...) and stops at the first listen of that album.
      const { results } = await db
        .prepare(
          `SELECT json_extract(p.value, '$[0]') AS artist, json_extract(p.value, '$[1]') AS album FROM json_each(?2) AS p
           WHERE EXISTS (SELECT 1 FROM listens WHERE user_id = ?1 AND artist_name = json_extract(p.value, '$[0]')
                         AND release_name = json_extract(p.value, '$[1]'))`,
        )
        .bind(userId, JSON.stringify(pairs))
        .all<{ artist: string; album: string }>();
      return new Set(results.map((r) => `${r.artist}\u0000${r.album}`));
    },
    async spellings(pairs) {
      if (pairs.length === 0) return new Map();
      const json = JSON.stringify(pairs);
      // Record the new keys, then read every key back: one batch, so one round trip.
      const [, read] = await db.batch([
        db
          .prepare(
            "INSERT OR IGNORE INTO artist_spellings (key, artist) SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?1)",
          )
          .bind(json),
        db
          .prepare(
            "SELECT key, artist FROM artist_spellings WHERE key IN (SELECT json_extract(value, '$[0]') FROM json_each(?1))",
          )
          .bind(json),
      ]);
      return new Map(
        ((read?.results ?? []) as { key: string; artist: string }[]).map((r) => [r.key, r.artist]),
      );
    },
    async albumsStartingWith(userId, name) {
      // Reads the user's listens (no index on release_name): only run for a native-script name seen for the
      // first time, which then becomes known or an alias and never costs this again.
      const { results } = await db
        .prepare(
          `SELECT DISTINCT artist_name AS artist, release_name AS album FROM listens
           WHERE user_id = ?1 AND artist_name <> ?2 AND substr(release_name, 1, length(?2)) = ?2
           LIMIT 20`,
        )
        .bind(userId, name)
        .all<{ artist: string; album: string }>();
      return results;
    },
  };
}
