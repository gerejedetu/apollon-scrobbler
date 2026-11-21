-- Other ways an artist's name arrives ("헤이즈 Heize", "헤이즈") mapped to the name already used ("Heize"),
-- learned at ingest so later listens under any of them join the same artist. Global: names, not users.
CREATE TABLE artist_aliases (
  alias  TEXT PRIMARY KEY,
  artist TEXT NOT NULL
) STRICT, WITHOUT ROWID;
