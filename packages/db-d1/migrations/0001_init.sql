-- Scrobbler schema for SQLite / Cloudflare D1. Timestamps are Unix seconds (UTC).

CREATE TABLE users (
  id           INTEGER PRIMARY KEY,
  name         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  created_at   INTEGER NOT NULL,
  -- Kept up to date by the adapter in the same batch as each insert/delete (via changes()),
  -- so listen counts never scan the listens table and cost one row write per batch, not per listen.
  listen_count INTEGER NOT NULL DEFAULT 0
) STRICT;

-- Only the SHA-256 of a token is stored. WITHOUT ROWID: the hash is the whole lookup key.
CREATE TABLE api_tokens (
  token_hash TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
) STRICT, WITHOUT ROWID;

CREATE INDEX api_tokens_user ON api_tokens (user_id);

CREATE TABLE listens (
  id              INTEGER PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  listened_at     INTEGER NOT NULL,
  inserted_at     INTEGER NOT NULL,
  recording_msid  TEXT    NOT NULL,
  artist_name     TEXT    NOT NULL,
  track_name      TEXT    NOT NULL,
  release_name    TEXT,
  recording_mbid  TEXT,
  release_mbid    TEXT,
  artist_mbids    TEXT, -- JSON array, NULL when empty
  additional_info TEXT  -- JSON object, NULL when empty
) STRICT;

-- One index serves both deduplication (same user, time and track = same listen, as in ListenBrainz)
-- and every time-range read (listing, min/max, stats windows) via its (user_id, listened_at) prefix.
CREATE UNIQUE INDEX listens_user_time_track ON listens (user_id, listened_at, track_name);

CREATE TABLE playing_now (
  user_id        INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  track_metadata TEXT    NOT NULL, -- JSON
  expires_at     INTEGER NOT NULL
) STRICT;

CREATE TABLE latest_imports (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  service TEXT    NOT NULL,
  ts      INTEGER NOT NULL,
  PRIMARY KEY (user_id, service)
) STRICT, WITHOUT ROWID;
