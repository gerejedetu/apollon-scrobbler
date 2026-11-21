-- Joint credits ("Peso Pluma & Estevan Plazola") and the artists they name, so a joint listen counts for
-- each artist in artist stats. Only credits naming several artists are stored (split by core's
-- splitArtistCredit); every other credit is its own single artist. Global, not per user: the split only
-- depends on the text. Filled on insert; existing credits by `vp run db:backfill-credits` (apps/api/scripts/turso.ts).
CREATE TABLE artist_credits (
  credit TEXT NOT NULL,
  artist TEXT NOT NULL,
  PRIMARY KEY (credit, artist)
) STRICT, WITHOUT ROWID;

-- Artist pages look up the credits that name an artist.
CREATE INDEX artist_credits_artist ON artist_credits (artist);
