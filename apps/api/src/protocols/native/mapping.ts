/**
 * The native JSON shapes (camelCase, flat) and their mapping to and from the ListenBrainz wire format
 * that core validates. Going through core keeps both protocols under exactly the same rules.
 */
import { ApiError } from "@scrobbler/core";
import type {
  AdditionalInfo,
  ApiListen,
  StatsResult,
  TopRow,
  TrackMetadata,
} from "@scrobbler/types";

export interface NativeTrack {
  artist: string;
  track: string;
  album?: string | null;
  durationMs?: number | null;
  mbids?: { recording?: string | null; release?: string | null; artists?: string[] };
  /** Anything else the client wants to keep (player, source URL...). Stored as-is. */
  extra?: Record<string, unknown>;
}

export interface NativeListenInput extends NativeTrack {
  /** Unix seconds or an ISO 8601 date. Defaults to now. */
  listenedAt?: number | string;
}

export interface NativeListen extends Required<Pick<NativeTrack, "artist" | "track">> {
  id: string;
  listenedAt: number;
  insertedAt: number;
  album: string | null;
  durationMs: number | null;
  mbids: { recording: string | null; release: string | null; artists: string[] };
  extra: Record<string, unknown>;
}

const RESERVED = new Set([
  "duration_ms",
  "recording_mbid",
  "release_mbid",
  "artist_mbids",
  "recording_msid",
]);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseListenedAt(raw: unknown, index: number): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const ms = Date.parse(raw);
    if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
  }
  throw ApiError.badRequest(
    `listens[${index}].listenedAt must be Unix seconds or an ISO 8601 date.`,
  );
}

export function toTrackMetadata(raw: unknown, where: string): TrackMetadata {
  if (!isObject(raw)) throw ApiError.badRequest(`${where} must be an object.`);
  const { artist, track, album, durationMs, mbids, extra } = raw;
  if (typeof artist !== "string" || !artist.trim())
    throw ApiError.badRequest(`${where}.artist is required.`);
  if (typeof track !== "string" || !track.trim())
    throw ApiError.badRequest(`${where}.track is required.`);
  if (extra !== undefined && !isObject(extra))
    throw ApiError.badRequest(`${where}.extra must be an object.`);
  if (mbids !== undefined && !isObject(mbids))
    throw ApiError.badRequest(`${where}.mbids must be an object.`);

  const info: AdditionalInfo = { ...(extra as Record<string, unknown> | undefined) };
  for (const key of RESERVED) delete info[key];
  if (durationMs !== undefined && durationMs !== null) info.duration_ms = durationMs as number;
  const ids = (mbids ?? {}) as Record<string, unknown>;
  if (typeof ids.recording === "string") info.recording_mbid = ids.recording;
  if (typeof ids.release === "string") info.release_mbid = ids.release;
  if (Array.isArray(ids.artists)) info.artist_mbids = ids.artists as string[];

  const meta: TrackMetadata = { artist_name: artist, track_name: track, additional_info: info };
  if (typeof album === "string" && album.trim()) meta.release_name = album;
  return meta;
}

/** Native `POST /v1/listens` body -> ListenBrainz import submission. */
export function toSubmission(body: unknown, now: number) {
  if (!isObject(body) || !Array.isArray(body.listens) || body.listens.length === 0) {
    throw ApiError.badRequest("Body must be { listens: [...] } with at least one listen.");
  }
  return {
    listen_type: "import",
    payload: body.listens.map((item: unknown, i: number) => ({
      listened_at: parseListenedAt(isObject(item) ? item.listenedAt : undefined, i) ?? now,
      track_metadata: toTrackMetadata(item, `listens[${i}]`),
    })),
  };
}

export function fromTrackMetadata(meta: TrackMetadata) {
  const {
    duration_ms,
    recording_mbid,
    release_mbid,
    artist_mbids,
    recording_msid: _msid,
    ...extra
  } = meta.additional_info ?? {};
  return {
    artist: meta.artist_name,
    track: meta.track_name,
    album: meta.release_name ?? null,
    durationMs: typeof duration_ms === "number" ? duration_ms : null,
    mbids: {
      recording: recording_mbid ?? null,
      release: release_mbid ?? null,
      artists: artist_mbids ?? [],
    },
    extra,
  };
}

export function fromApiListen(listen: ApiListen): NativeListen {
  return {
    id: listen.recording_msid,
    listenedAt: listen.listened_at,
    insertedAt: listen.inserted_at,
    ...fromTrackMetadata(listen.track_metadata),
  };
}

function statItem(row: TopRow) {
  return {
    artist: row.artistName,
    track: row.trackName,
    album: row.releaseName,
    mbids: { recording: row.recordingMbid, release: row.releaseMbid, artists: row.artistMbids },
    listenCount: row.listenCount,
  };
}

export function presentNativeStats(result: StatsResult, offset: number) {
  return {
    entity: result.entity,
    range: result.range,
    from: result.window.fromTs,
    to: result.window.toTs,
    total: result.total,
    offset,
    items: result.rows.map(statItem),
    lastUpdated: result.lastUpdated,
  };
}
