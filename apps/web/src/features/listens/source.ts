import type { Track } from "../../api/index.ts";
import { m } from "../../paraglide/messages.js";

/** Which app sent a listen, for the history chip: manual entries, imports, or the player's own name. */
export function listenSource(track: Track): string | null {
  const extra = track.extra ?? {};
  if (extra.origin === "manual") return m.source_manual();
  if (extra.origin === "lastfm") return m.source_lastfm();
  for (const key of ["media_player", "submission_client", "music_service_name", "player"]) {
    const value = extra[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 32);
  }
  return null;
}

/** 330 000 ms → "5:30". */
export function formatTrackLength(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return "";
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
