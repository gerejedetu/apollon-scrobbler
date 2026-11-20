/** Row shapes as stored in SQLite, and their conversion to domain objects. */
import type { AdditionalInfo, StoredListen, User } from "@scrobbler/types";

export interface UserRow {
  id: number;
  name: string;
  created_at: number;
  listen_count: number;
  is_private: number;
}

export interface ListenRow {
  user_id: number;
  listened_at: number;
  inserted_at: number;
  recording_msid: string;
  artist_name: string;
  track_name: string;
  release_name: string | null;
  recording_mbid: string | null;
  release_mbid: string | null;
  artist_mbids: string | null;
  additional_info: string | null;
}

export const USER_COLUMNS = "id, name, created_at, listen_count, is_private";

export const LISTEN_COLUMNS =
  "user_id, listened_at, inserted_at, recording_msid, artist_name, track_name, release_name, recording_mbid, release_mbid, artist_mbids, additional_info";

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    listenCount: row.listen_count,
    isPrivate: row.is_private === 1,
  };
}

export function parseJson<T>(raw: string | null, fallback: T): T {
  if (raw === null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function toListen(row: ListenRow): StoredListen {
  return {
    userId: row.user_id,
    listenedAt: row.listened_at,
    insertedAt: row.inserted_at,
    recordingMsid: row.recording_msid,
    artistName: row.artist_name,
    trackName: row.track_name,
    releaseName: row.release_name,
    recordingMbid: row.recording_mbid,
    releaseMbid: row.release_mbid,
    artistMbids: parseJson<string[]>(row.artist_mbids, []),
    additionalInfo: parseJson<AdditionalInfo>(row.additional_info, {}),
  };
}

/** Stores empty JSON containers as NULL to keep rows small. */
export function jsonOrNull(value: unknown[] | Record<string, unknown>): string | null {
  const empty = Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0;
  return empty ? null : JSON.stringify(value);
}
