import { m } from "../../paraglide/messages.js";
/** Turning the manual scrobble form into a listen. Pure, so the rules are tested on their own. */

/** "5:30" or "5" (minutes) → milliseconds; empty → null; anything else → undefined (invalid). */
export function parseDuration(text: string): number | null | undefined {
  const t = text.trim();
  if (!t) return null;
  const m = /^(\d{1,3})(?::([0-5]\d))?$/.exec(t);
  if (!m) return undefined;
  const ms = (Number(m[1]) * 60 + Number(m[2] ?? 0)) * 1000;
  return ms > 0 ? ms : undefined;
}

/** A local date ("2026-11-15") and time ("22:40") → Unix seconds, read in the browser's time zone. */
export function localToUnix(date: string, time: string): number | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return undefined;
  const ts = new Date(`${date}T${time}:00`).getTime();
  return Number.isFinite(ts) ? Math.floor(ts / 1000) : undefined;
}

export interface ScrobbleForm {
  artist: string;
  track: string;
  album: string;
  duration: string;
  when: "now" | "other";
  date: string;
  time: string;
}

export type FieldErrors = Partial<Record<"artist" | "track" | "duration" | "date", string>>;

export interface ScrobbleListen {
  artist: string;
  track: string;
  album: string | null;
  durationMs: number | null;
  listenedAt: number;
}

export type ScrobbleCheck = { errors: FieldErrors } | { listen: ScrobbleListen };

export function validateScrobble(f: ScrobbleForm, now = Date.now() / 1000): ScrobbleCheck {
  const errors: FieldErrors = {};
  if (!f.artist.trim()) errors.artist = m.scrobble_err_artist();
  if (!f.track.trim()) errors.track = m.scrobble_err_track();
  const durationMs = parseDuration(f.duration);
  if (durationMs === undefined) errors.duration = m.scrobble_err_duration();
  let listenedAt = Math.floor(now);
  if (f.when === "other") {
    const at = localToUnix(f.date, f.time);
    if (at === undefined) errors.date = m.scrobble_err_date();
    else if (at > now + 60) errors.date = m.scrobble_err_future();
    else listenedAt = at;
  }
  if (Object.keys(errors).length) return { errors };
  return {
    listen: {
      artist: f.artist.trim(),
      track: f.track.trim(),
      album: f.album.trim() || null,
      durationMs: durationMs ?? null,
      listenedAt,
    },
  };
}
