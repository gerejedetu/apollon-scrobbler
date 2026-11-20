-- Better Auth's API key plugin regularly deletes expired keys with `WHERE expiresAt < ?`:
-- without this index that is a scan of every key of every user.
CREATE INDEX IF NOT EXISTS apikey_expiresAt_idx ON apikey (expiresAt);
