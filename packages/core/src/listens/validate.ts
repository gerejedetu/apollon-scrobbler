/**
 * Validation of `POST /1/submit-listens` bodies, following ListenBrainz's rules.
 * Pure functions: no I/O, so they are cheap to test exhaustively.
 */
import type { AdditionalInfo, ListenType, TrackMetadata } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import { LISTEN_LIMITS, MBID_KEYS, MBID_LIST_KEYS } from "./limits.ts";

const LISTEN_TYPES: readonly ListenType[] = ["single", "playing_now", "import"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();

export interface ValidListen {
  /** Absent only for `playing_now`. */
  listenedAt: number | null;
  trackMetadata: TrackMetadata;
}

export interface ValidSubmission {
  listenType: ListenType;
  listens: ValidListen[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isMbid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanAdditionalInfo(raw: unknown): AdditionalInfo {
  if (raw === undefined || raw === null) return {};
  if (!isObject(raw)) throw ApiError.badRequest("additional_info must be a JSON object.");
  const info: AdditionalInfo = { ...raw };

  for (const key of MBID_KEYS) {
    if (key in info && !isMbid(info[key])) delete info[key];
  }
  for (const key of MBID_LIST_KEYS) {
    if (!(key in info)) continue;
    const list = info[key];
    const valid = Array.isArray(list) ? list.filter(isMbid).map((m) => m.toLowerCase()) : [];
    if (valid.length > 0) info[key] = valid;
    else delete info[key];
  }

  if ("tags" in info) {
    const tags = info.tags;
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string")) {
      throw ApiError.badRequest("tags must be a list of strings.");
    }
    if (tags.length > LISTEN_LIMITS.maxTagsPerListen) {
      throw ApiError.badRequest(
        `Too many tags: a listen can have at most ${LISTEN_LIMITS.maxTagsPerListen}.`,
      );
    }
    if (tags.some((t) => t.length > LISTEN_LIMITS.maxTagLength)) {
      throw ApiError.badRequest(
        `Tag too long: tags can be at most ${LISTEN_LIMITS.maxTagLength} characters.`,
      );
    }
  }

  for (const key of ["duration_ms", "duration"] as const) {
    if (!(key in info)) continue;
    const value = info[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
      throw ApiError.badRequest(`${key} must be a positive integer.`);
    }
  }
  return info;
}

function validateTrackMetadata(raw: unknown): TrackMetadata {
  if (!isObject(raw)) throw ApiError.badRequest("JSON document must contain track_metadata.");
  const { artist_name, track_name, release_name } = raw;
  if (!nonEmptyString(artist_name)) {
    throw ApiError.badRequest(
      "JSON document does not contain required track_metadata.artist_name.",
    );
  }
  if (!nonEmptyString(track_name)) {
    throw ApiError.badRequest("JSON document does not contain required track_metadata.track_name.");
  }
  if (release_name !== undefined && release_name !== null && typeof release_name !== "string") {
    throw ApiError.badRequest("track_metadata.release_name must be a string.");
  }
  const meta: TrackMetadata = {
    artist_name: artist_name.trim(),
    track_name: track_name.trim(),
    additional_info: cleanAdditionalInfo(raw.additional_info),
  };
  if (typeof release_name === "string" && release_name.trim())
    meta.release_name = release_name.trim();
  return meta;
}

function validateListenedAt(raw: unknown): number {
  if (raw === undefined || raw === null) {
    throw ApiError.badRequest("JSON document must contain the key listened_at.");
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    throw ApiError.badRequest("Value for key listened_at must be an integer Unix timestamp.");
  }
  if (raw < LISTEN_LIMITS.minimumTs) {
    throw ApiError.badRequest(
      `Value for key listened_at is too low. listened_at timestamp should be greater than ${LISTEN_LIMITS.minimumTs} (2002-10-01 00:00:00 UTC).`,
    );
  }
  return raw;
}

export function validateSubmission(body: unknown): ValidSubmission {
  if (!isObject(body)) throw ApiError.badRequest("Invalid JSON document submitted.");
  const { listen_type, payload } = body;

  if (typeof listen_type !== "string" || !LISTEN_TYPES.includes(listen_type as ListenType)) {
    throw ApiError.badRequest(
      "JSON document must contain a valid listen_type: single, playing_now or import.",
    );
  }
  const listenType = listen_type as ListenType;
  if (!Array.isArray(payload) || payload.length === 0) {
    throw ApiError.badRequest("JSON document must contain a non-empty payload list.");
  }
  if (listenType !== "import" && payload.length !== 1) {
    throw ApiError.badRequest(
      `JSON document should contain exactly one listen for listen_type ${listenType}.`,
    );
  }
  if (payload.length > LISTEN_LIMITS.maxListensPerRequest) {
    throw ApiError.badRequest(
      `Too many listens. You may not submit more than ${LISTEN_LIMITS.maxListensPerRequest} listens at once.`,
    );
  }

  const listens = payload.map((item: unknown): ValidListen => {
    if (!isObject(item)) throw ApiError.badRequest("Each listen in payload must be a JSON object.");
    if (encoder.encode(JSON.stringify(item)).length > LISTEN_LIMITS.maxListenBytes) {
      throw ApiError.badRequest(
        `Listen exceeds the maximum size of ${LISTEN_LIMITS.maxListenBytes} bytes.`,
      );
    }
    const trackMetadata = validateTrackMetadata(item.track_metadata);
    // ListenBrainz rejects listened_at on playing_now; we accept and ignore it, which is friendlier to clients.
    const listenedAt = listenType === "playing_now" ? null : validateListenedAt(item.listened_at);
    return { listenedAt, trackMetadata };
  });

  return { listenType, listens };
}
