/**
 * Domain shapes used between core services and storage adapters.
 * Timestamps are Unix seconds (UTC) everywhere.
 */
import type { AdditionalInfo, StatsEntity, StatsRange, TrackMetadata } from "./listenbrainz.ts";

export type UserId = number;

export interface User {
  id: UserId;
  name: string;
  createdAt: number;
  /** Maintained by the storage layer on every insert and delete. */
  listenCount: number;
  /** When true, only the owner can read this user's listens and stats. */
  isPrivate: boolean;
}

/** A listen validated by core and ready to be stored. */
export interface NewListen {
  listenedAt: number;
  recordingMsid: string;
  artistName: string;
  trackName: string;
  releaseName: string | null;
  recordingMbid: string | null;
  releaseMbid: string | null;
  artistMbids: string[];
  additionalInfo: AdditionalInfo;
}

export interface StoredListen extends NewListen {
  userId: UserId;
  insertedAt: number;
}

export interface PlayingNow {
  userId: UserId;
  trackMetadata: TrackMetadata;
  expiresAt: number;
}

export interface ListenQuery {
  userId: UserId;
  /** Only listens strictly older than this. */
  maxTs?: number;
  /** Only listens strictly newer than this. */
  minTs?: number;
  limit: number;
}

export interface ListenPage {
  listens: StoredListen[];
  oldestListenTs: number | null;
  latestListenTs: number | null;
}

export interface TimeWindow {
  /** Inclusive. */
  fromTs: number;
  /** Inclusive. */
  toTs: number;
}

export interface TopQuery {
  userId: UserId;
  entity: StatsEntity;
  window: TimeWindow;
  limit: number;
  offset: number;
}

export interface TopRow {
  artistName: string;
  artistMbids: string[];
  trackName: string | null;
  releaseName: string | null;
  recordingMbid: string | null;
  releaseMbid: string | null;
  listenCount: number;
}

export interface TopResult {
  rows: TopRow[];
  /** Number of distinct entities in the window (for pagination). */
  total: number;
}

export interface StatsResult extends TopResult {
  entity: StatsEntity;
  range: StatsRange;
  window: TimeWindow;
  lastUpdated: number;
}

export interface ActivityQuery {
  userId: UserId;
  window: TimeWindow;
  /** Shift applied before cutting days, so days follow the viewer's local midnight. */
  utcOffsetSeconds: number;
}

export interface ActivityDay {
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;
  listenCount: number;
}

export interface Summary {
  listenCount: number;
  artistCount: number;
  recordingCount: number;
  releaseCount: number;
  firstListenedAt: number | null;
  lastListenedAt: number | null;
}

export interface ArtistTrack {
  trackName: string;
  releaseName: string | null;
  recordingMbid: string | null;
  listenCount: number;
}

export interface ArtistAlbum {
  releaseName: string;
  releaseMbid: string | null;
  listenCount: number;
  /** Distinct tracks of this album that were played. */
  trackCount: number;
  firstListenedAt: number;
  lastListenedAt: number;
}

export interface ArtistDetail {
  artistName: string;
  artistMbids: string[];
  listenCount: number;
  firstListenedAt: number | null;
  lastListenedAt: number | null;
  topTracks: ArtistTrack[];
  /** This artist's albums, most played first. */
  albums: ArtistAlbum[];
  /** Distinct albums of this artist in the window. */
  albumCount: number;
  /** Distinct tracks of this artist in the window. */
  trackCount: number;
}

export interface ArtistQuery {
  userId: UserId;
  artistName: string;
  window: TimeWindow;
  limit: number;
}
