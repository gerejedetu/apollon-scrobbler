/**
 * SQL pieces for artist-level stats: a listen counts for every artist of its credit (see
 * migrations/0005_artist_credits.sql). Credits without a row in artist_credits are their own artist.
 */

/** FROM clause: one row per (listen, artist). */
export const ARTIST_LISTENS = "listens LEFT JOIN artist_credits ON credit = artist_name";

/** The artist a row of ARTIST_LISTENS counts for. */
export const ARTIST = "coalesce(artist, artist_name)";

/**
 * WHERE fragment matching every listen credited to the artist bound at `?n`, joint credits included.
 * Each IN value is looked up through the (user_id, artist_name, listened_at) index.
 */
export const creditedTo = (n: number) =>
  `artist_name IN (SELECT ?${n} UNION SELECT credit FROM artist_credits WHERE artist = ?${n})`;

/** Statement adding the (credit, artist) pairs of new joint credits, bound as one JSON parameter. */
export const INSERT_CREDITS_SQL = `INSERT OR IGNORE INTO artist_credits (credit, artist)
SELECT json_extract(j.value, '$[0]'), json_extract(j.value, '$[1]') FROM json_each(?1) AS j`;
