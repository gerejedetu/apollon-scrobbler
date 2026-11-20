/** Limits mirrored from ListenBrainz so that clients behave the same against this server. */
export const LISTEN_LIMITS = {
  /** Oldest accepted `listened_at`: 2002-10-01 00:00:00 UTC (ListenBrainz's own floor). */
  minimumTs: 1033430400,
  maxListensPerRequest: 1000,
  /** Max size of one listen once serialised, in bytes. */
  maxListenBytes: 10240,
  maxTagsPerListen: 50,
  maxTagLength: 64,
  /** `GET .../listens` page size. */
  defaultItemsPerGet: 25,
  maxItemsPerGet: 1000,
  /** How long a "playing now" entry lives when the client sends no duration, in seconds. */
  playingNowDefaultTtl: 8 * 60,
  playingNowMaxTtl: 60 * 60,
} as const;

/** Keys of `additional_info` that must hold a MusicBrainz id. Invalid ids are dropped, not rejected. */
export const MBID_KEYS = [
  "release_group_mbid",
  "release_mbid",
  "recording_mbid",
  "track_mbid",
] as const;
export const MBID_LIST_KEYS = ["artist_mbids", "work_mbids"] as const;
