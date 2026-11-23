-- Every obsession a user has had, not only the current one: a row opens when a track becomes the obsession
-- and closes (ended_at) when it is replaced or cleared. The current one is the row with ended_at NULL.
CREATE TABLE obsession_history (
  id             INTEGER PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  artist_name    TEXT    NOT NULL,
  track_name     TEXT    NOT NULL,
  release_name   TEXT,
  recording_mbid TEXT,
  release_mbid   TEXT,
  started_at     INTEGER NOT NULL,
  ended_at       INTEGER
) STRICT;

-- Read newest first per user.
CREATE INDEX obsession_history_user_time ON obsession_history (user_id, started_at);

-- The obsessions set before this table existed start the history.
INSERT INTO obsession_history (user_id, artist_name, track_name, release_name, recording_mbid, release_mbid, started_at)
SELECT user_id, artist_name, track_name, release_name, recording_mbid, release_mbid, set_at FROM obsessions;
