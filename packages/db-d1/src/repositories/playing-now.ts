import type { PlayingNowRepository } from "@scrobbler/core";
import type { TrackMetadata } from "@scrobbler/types";
import type { D1Like } from "../d1.ts";
import { parseJson } from "../rows.ts";

export function d1PlayingNow(db: D1Like): PlayingNowRepository {
  return {
    async set({ userId, trackMetadata, expiresAt }) {
      await db
        .prepare(
          "INSERT INTO playing_now (user_id, track_metadata, expires_at) VALUES (?1, ?2, ?3) ON CONFLICT (user_id) DO UPDATE SET track_metadata = excluded.track_metadata, expires_at = excluded.expires_at",
        )
        .bind(userId, JSON.stringify(trackMetadata), expiresAt)
        .run();
    },
    async get(userId, now) {
      const row = await db
        .prepare("SELECT track_metadata, expires_at FROM playing_now WHERE user_id = ?1 AND expires_at > ?2")
        .bind(userId, now)
        .first<{ track_metadata: string; expires_at: number }>();
      if (!row) return null;
      return { userId, trackMetadata: parseJson<TrackMetadata>(row.track_metadata, { artist_name: "", track_name: "" }), expiresAt: row.expires_at };
    },
  };
}
