import type { InstanceRepository } from "@scrobbler/core";
import type { D1Like } from "../d1.ts";

export function d1Instance(db: D1Like): InstanceRepository {
  return {
    async hasUsersAndSetting(key) {
      // Both are single index lookups (users by rowid, settings by key): 2 rows read at most.
      const row = await db
        .prepare(
          "SELECT EXISTS (SELECT 1 FROM users) AS has_users, (SELECT value FROM instance_settings WHERE key = ?1) AS value",
        )
        .bind(key)
        .first<{ has_users: number; value: string | null }>();
      return [row?.has_users === 1, row?.value ?? null];
    },
    async setSetting(key, value) {
      await db
        .prepare(
          "INSERT INTO instance_settings (key, value) VALUES (?1, ?2) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
        )
        .bind(key, value)
        .run();
    },
    async ownerUserId() {
      const row = await db
        .prepare("SELECT min(id) AS id FROM users") // one row read from the end of the b-tree, not a scan
        .first<{ id: number | null }>();
      return row?.id ?? null;
    },
  };
}
