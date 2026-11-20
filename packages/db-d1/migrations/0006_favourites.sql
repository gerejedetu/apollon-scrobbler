-- Loved tracks (one per artist + title, like Last.fm) and the current obsession (at most one per user).
CREATE TABLE loved_tracks (
  user_id        INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  artist_name    TEXT    NOT NULL,
  track_name     TEXT    NOT NULL,
  release_name   TEXT,
  recording_mbid TEXT,
  release_mbid   TEXT,
  loved_at       INTEGER NOT NULL,
  PRIMARY KEY (user_id, artist_name, track_name)
) STRICT, WITHOUT ROWID;

-- The loved list is read newest first.
CREATE INDEX loved_tracks_user_time ON loved_tracks (user_id, loved_at);

CREATE TABLE obsessions (
  user_id        INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  artist_name    TEXT    NOT NULL,
  track_name     TEXT    NOT NULL,
  release_name   TEXT,
  recording_mbid TEXT,
  release_mbid   TEXT,
  set_at         INTEGER NOT NULL
) STRICT;
