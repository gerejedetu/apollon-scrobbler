/**
 * Shapes of the extended statistics ("insights"). All of them are computed for one user, from their own
 * listens only. Timestamps are Unix seconds; `utcOffsetSeconds` shifts time before cutting hours/days.
 */
import type { TimeWindow, UserId } from "./domain.ts";

/** Time buckets. `weekday`: 0 = Monday … 6 = Sunday. `week`: weeks start on Monday. */
export type Bucket = "hour" | "weekday" | "hour_weekday" | "day" | "week" | "month" | "year";

export interface InsightQuery {
  userId: UserId;
  window: TimeWindow;
  utcOffsetSeconds: number;
}

/** `key` is a number for hour/weekday/day/week (day/week = index since 1970), a string for month (YYYY-MM) and year. */
export interface BucketCount {
  key: number | string;
  /** Only for hour_weekday. */
  hour?: number;
  listenCount: number;
}

export type InsightEntity = "artists" | "recordings" | "releases";

/** Identifies an artist, a track (artist + track) or an album (artist + album). */
export interface EntityKey {
  artistName: string;
  trackName?: string | null;
  releaseName?: string | null;
}

export interface EntityCount extends EntityKey {
  listenCount: number;
}

export interface Discovery extends EntityCount {
  firstListenedAt: number;
}

export interface Forgotten extends EntityCount {
  lastListenedAt: number;
}

export interface Trend extends EntityKey {
  current: number;
  previous: number;
  /** current - previous. */
  change: number;
}

export interface EntityDetail {
  listenCount: number;
  firstListenedAt: number | null;
  lastListenedAt: number | null;
}

export interface AlbumTrack {
  trackName: string;
  listenCount: number;
  firstListenedAt: number;
  lastListenedAt: number;
}

export interface Diversity {
  listenCount: number;
  artistCount: number;
  /** Listens of the 10 most played artists. */
  top10ArtistListens: number;
  topArtistListens: number;
}

export interface SessionStats {
  sessionCount: number;
  /** Listens per session. */
  averageListens: number;
  averageDurationSeconds: number;
  longest: { listenCount: number; startedAt: number; endedAt: number } | null;
}

export interface Repeat extends EntityKey {
  /** Longest run of this track played back to back. */
  longestRun: number;
  startedAt: number;
}

export interface Milestone {
  n: number;
  listenedAt: number;
  artistName: string;
  trackName: string;
  releaseName: string | null;
}

export interface ChartEntry extends EntityCount {
  period: string;
  rank: number;
}

/** An album played through: several of its tracks back to back, nothing else in between, in one session. */
export interface AlbumRun {
  artistName: string;
  releaseName: string;
  releaseMbid: string | null;
  /** Distinct tracks of the album in the run. */
  trackCount: number;
  listenCount: number;
  startedAt: number;
  endedAt: number;
}
