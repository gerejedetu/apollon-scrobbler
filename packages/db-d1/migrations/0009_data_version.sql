-- Bumped by every change to a user's listens (insert, delete, rename). Stats caches are keyed by it, so
-- they refresh on any change, even one that leaves the listen count as it was (delete then re-add, merges).
ALTER TABLE users ADD COLUMN data_version INTEGER NOT NULL DEFAULT 0;
