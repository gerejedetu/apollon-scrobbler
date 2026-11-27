-- The name each spelling of an artist is stored under: "Despo' Rutti", "despo rutti" and "Despo Rutti" share the key
-- "desporutti" (core's artistKey: case, apostrophes, periods, dashes and spaces ignored), so a new listen under any
-- of them joins the name the library already uses. Global, like artist_aliases. Filled at ingest and by the
-- `dedupe-artists` maintenance command.
CREATE TABLE artist_spellings (
  key    TEXT PRIMARY KEY,
  artist TEXT NOT NULL
) STRICT, WITHOUT ROWID;
