-- Instance-wide settings (key -> value), e.g. whether new accounts may sign up.
CREATE TABLE instance_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT, WITHOUT ROWID;
