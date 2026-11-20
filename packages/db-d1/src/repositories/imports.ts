import type { ImportRepository } from "@scrobbler/core";
import type { D1Like } from "../d1.ts";

export function d1Imports(db: D1Like): ImportRepository {
  return {
    async getLatest(userId, service) {
      const row = await db.prepare("SELECT ts FROM latest_imports WHERE user_id = ?1 AND service = ?2").bind(userId, service).first<{ ts: number }>();
      return row?.ts ?? 0;
    },
    async setLatest(userId, service, ts) {
      await db
        .prepare("INSERT INTO latest_imports (user_id, service, ts) VALUES (?1, ?2, ?3) ON CONFLICT (user_id, service) DO UPDATE SET ts = excluded.ts")
        .bind(userId, service, ts)
        .run();
    },
  };
}
