/** Shapes of the native API (/v1), as documented in its OpenAPI. Timestamps are Unix seconds (UTC). */

export type Range =
  | "this_week"
  | "this_month"
  | "this_year"
  | "week"
  | "month"
  | "quarter"
  | "half_yearly"
  | "year"
  | "all_time";

export type Entity = "artists" | "recordings" | "releases";

export interface Me {
  userName: string;
  listenCount: number;
  createdAt: number;
  private: boolean;
  /** The instance owner (first account): the only one who can open or close sign-up. */
  owner?: boolean;
}

/** GET /v1/instance */
export interface Instance {
  signupOpen: boolean;
  hasUsers: boolean;
}

export interface Mbids {
  recording?: string | null;
  release?: string | null;
  artists?: string[];
}

export interface Track {
  artist: string;
  track: string;
  album?: string | null;
  durationMs?: number | null;
  mbids?: Mbids;
  /** Whatever else the client sent (player, client name…). */
  extra?: Record<string, unknown>;
}

export interface Listen extends Track {
  id: string;
  listenedAt: number;
  insertedAt: number;
}

export interface ListensPage {
  userName: string;
  count: number;
  listens: Listen[];
  oldestListenedAt: number | null;
  latestListenedAt: number | null;
  next: number | null;
}

export interface NowPlaying {
  userName: string;
  nowPlaying: Track | null;
}

interface Ranged {
  range: Range;
  from: number;
  to: number;
  lastUpdated?: number;
}

export interface TopItem {
  artist: string;
  track?: string | null;
  album?: string | null;
  mbids?: Mbids;
  listenCount: number;
}

export interface Top extends Ranged {
  entity: Entity;
  total: number;
  offset: number;
  items: TopItem[];
}

export interface Summary extends Ranged {
  listenCount: number;
  artistCount: number;
  recordingCount: number;
  releaseCount: number;
  firstListenedAt: number | null;
  lastListenedAt: number | null;
  activeDays: number;
  averagePerDay: number;
  averagePerActiveDay: number;
  busiestDay?: { date: string; listenCount: number };
  listeningTime: { totalMs: number; listensWithDuration: number };
}

export interface Activity extends Ranged {
  granularity: "day" | "week" | "month" | "year";
  periods?: { period: string; listenCount: number }[];
  days?: { date: string; listenCount: number }[];
}

export interface Clock extends Ranged {
  hours: { hour: number; listenCount: number }[];
  weekdays: { weekday: string; listenCount: number }[];
  heatmap: number[][];
}

export interface Streaks {
  activeDays: number;
  current: { days: number; since: string | null };
  /** Null before the first listen. */
  longest: { days: number; from: string; to: string } | null;
}

/** A row of the insight lists: an artist, a track or an album depending on the endpoint. */
export interface EntityRow {
  artistName: string;
  trackName?: string | null;
  releaseName?: string | null;
  listenCount: number;
}

export interface Discovery extends EntityRow {
  firstListenedAt: number;
}

export interface Discoveries extends Ranged {
  artists: { total: number; items: Discovery[] };
  tracks: { total: number; items: Discovery[] };
}

export interface Forgotten {
  months: number;
  minListens: number;
  entity: Entity;
  items: (EntityRow & { lastListenedAt: number })[];
}

export interface Change extends EntityRow {
  current: number;
  previous: number;
  change: number;
}

export interface OnRepeat {
  from: number;
  to: number;
  items: Change[];
}

export interface Trends extends Ranged {
  previous: { from: number; to: number };
  rising: Change[];
  falling: Change[];
}

export interface Compare extends Ranged {
  current: Record<string, number>;
  before: Record<string, number>;
  changePercent: Record<string, number | null>;
}

export interface OneShots extends Ranged {
  total: number;
  items: EntityRow[];
}

export interface Diversity extends Ranged {
  listenCount: number;
  artistCount: number;
  topArtistListens: number;
  top10ArtistListens: number;
  topArtistShare: number;
  top10ArtistShare: number;
  uniqueArtistRatio: number;
}

export interface Sessions extends Ranged {
  gapMinutes: number;
  sessionCount: number;
  averageListens: number;
  averageDurationSeconds: number;
  longest: { listenCount: number; startedAt: number; endedAt: number } | null;
}

export interface Milestones {
  listenCount: number;
  next: number | null;
  items: {
    n: number;
    listenedAt: number;
    artistName: string;
    trackName: string;
    releaseName?: string | null;
  }[];
}

export interface OnThisDay {
  date: string;
  years: { year: number; yearsAgo: number; listenCount: number; tracks: EntityRow[] }[];
}

export interface Wrapped {
  year: number;
  from: number;
  to: number;
  listenCount: number;
  artistCount: number;
  recordingCount: number;
  releaseCount: number;
  firstListenedAt: number | null;
  lastListenedAt: number | null;
  listeningTimeMs: number;
  activeDays: number;
  longestStreakDays: number;
  busiestDay?: { date: string; listenCount: number } | null;
  busiestMonth?: { month: string; listenCount: number } | null;
  favouriteHour?: { hour: number; listenCount: number } | null;
  topArtists: { artist: string; listenCount: number }[];
  topTracks: { artist: string; track: string; listenCount: number }[];
  topAlbums: { artist: string; album: string; listenCount: number }[];
  newArtists: number;
  newTracks: number;
  topDiscoveries: Discovery[];
  longestSession?: { listenCount: number; startedAt: number; endedAt: number } | null;
}

export interface ArtistPage extends Ranged {
  artist: string;
  mbids?: string[];
  listenCount: number;
  trackCount: number;
  albumCount: number;
  firstListenedAt: number | null;
  lastListenedAt: number | null;
  albums: {
    album: string;
    releaseMbid?: string | null;
    listenCount: number;
    trackCount: number;
    firstListenedAt: number;
    lastListenedAt: number;
  }[];
  topTracks: {
    track: string;
    album?: string | null;
    recordingMbid?: string | null;
    listenCount: number;
  }[];
}

export interface Timeline extends Ranged {
  artist: string;
  granularity: "week" | "month" | "year";
  periods: { period: string; listenCount: number }[];
}

export interface AlbumPage extends Ranged {
  artist: string;
  album: string;
  listenCount: number;
  firstListenedAt: number | null;
  lastListenedAt: number | null;
  tracks: {
    trackName: string;
    listenCount: number;
    firstListenedAt: number;
    lastListenedAt: number;
  }[];
}

export interface TrackPage extends Ranged {
  artist: string;
  track: string;
  listenCount: number;
  firstListenedAt: number | null;
  lastListenedAt: number | null;
  byMonth: { period: string; listenCount: number }[];
}

/** A Better Auth API key as listed (the secret itself is only returned once, at creation). */
export interface ApiKey {
  id: string;
  name: string | null;
  /** First characters of the key, to recognise it. */
  start: string | null;
  createdAt: string;
  lastRequest?: string | null;
  enabled?: boolean;
}

export interface CreatedApiKey extends ApiKey {
  key: string;
}

/** A loved track or the obsession, with when it was set. */
export interface Favourite {
  artist: string;
  track: string;
  album: string | null;
  mbids: { recording: string | null; release: string | null };
  lovedAt?: number;
  since?: number;
}

export interface LovedPage {
  userName: string;
  total: number;
  items: Favourite[];
}

/** What identifies a track for loving it or making it the obsession. */
export interface TrackRef {
  artist: string;
  track: string;
  album?: string | null;
  mbids?: { recording?: string | null; release?: string | null };
}
