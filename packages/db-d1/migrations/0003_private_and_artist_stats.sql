-- Private profiles: only the owner can read their listens and stats.
ALTER TABLE users ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0 CHECK (is_private IN (0, 1));

-- Artist pages read one artist's listens over a window without scanning the whole history.
-- Costs one extra index entry per listen written.
CREATE INDEX listens_user_artist_time ON listens (user_id, artist_name, listened_at);
