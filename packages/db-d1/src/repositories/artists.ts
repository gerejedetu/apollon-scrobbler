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
  };
}
