/**
 * Ports: the only way core talks to the outside world.
 * A storage adapter (D1, Postgres, SQLite...) implements `Repositories`;
 * an identity provider (Better Auth) implements `TokenVerifier`;
 * a cache adapter (KV, memory...) implements `Cache`.
 */
import type {
  ActivityQuery,
  AlbumTrack,
  Bucket,
  BucketCount,
  ChartEntry,
  Discovery,
  Diversity,
  EntityCount,
  EntityDetail,
  EntityKey,
  FavouriteTrack,
  Forgotten,
  InsightEntity,
  InsightQuery,
  Milestone,
  Repeat,
  SessionStats,
  Trend,
  ArtistDetail,
  ArtistQuery,
  ListenPage,
  ListenQuery,
  NewListen,
  PlayingNow,
  Summary,
  TimeWindow,
  TopQuery,
  TopResult,
  User,
  UserId,
} from "@scrobbler/types";

/**
 * Scrobbler profiles. Each one belongs to exactly one account of the identity provider (`authUserId`);
 * accounts, sessions and tokens themselves live with the identity provider, not here.
 */
export interface UserRepository {
  findByName(name: string): Promise<User | null>;
  findByAuthId(authUserId: string): Promise<User | null>;
  /** Returns null when the name or the account is already taken (names are case-insensitive). */
  create(authUserId: string, name: string, createdAt: number): Promise<User | null>;
  setPrivate(userId: UserId, isPrivate: boolean): Promise<User | null>;
}

/** Checks a raw ListenBrainz-style user token and returns the identity provider's account id. */
export interface TokenVerifier {
  verify(rawToken: string): Promise<string | null>;
}

export interface ListenRepository {
  /** Inserts listens, ignoring duplicates. Returns how many rows were actually inserted. */
  insertMany(userId: UserId, listens: NewListen[], insertedAt: number): Promise<number>;
  page(query: ListenQuery): Promise<ListenPage>;
  /** Returns true when a listen was deleted. */
  delete(userId: UserId, listenedAt: number, recordingMsid: string): Promise<boolean>;
}

export interface PlayingNowRepository {
  set(entry: PlayingNow): Promise<void>;
  /** Returns the entry only if it has not expired at `now`. */
  get(userId: UserId, now: number): Promise<PlayingNow | null>;
}

export interface ImportRepository {
  getLatest(userId: UserId, service: string): Promise<number>;
  setLatest(userId: UserId, service: string, ts: number): Promise<void>;
}

export interface StatsRepository {
  top(query: TopQuery): Promise<TopResult>;
  /** Listen counts per local day; `day` = days since 1970-01-01 after applying the offset. Days without listens are omitted. */
  activity(query: ActivityQuery): Promise<{ day: number; listenCount: number }[]>;
  summary(userId: UserId, window: TimeWindow): Promise<Summary>;
  /** Null when the user has no listen of this artist in the window. */
  artist(query: ArtistQuery): Promise<ArtistDetail | null>;
}

/** Extended statistics. Each method is one D1 round trip at most; results are cached by core. */
export interface InsightsRepository {
  /** Listen counts per time bucket, buckets without listens omitted, sorted by key. */
  histogram(query: InsightQuery & { bucket: Bucket }): Promise<BucketCount[]>;
  /** Distinct local days (days since 1970) with at least one listen, ascending. */
  listeningDays(query: InsightQuery): Promise<number[]>;
  /** Sum of `duration_ms` sent by clients, and how many listens carried one. */
  duration(query: InsightQuery): Promise<{ totalMs: number; listensWithDuration: number }>;
  /** Entities whose very first listen (over all time) falls in the window. */
  discoveries(
    query: InsightQuery & { entity: InsightEntity; limit: number },
  ): Promise<{ total: number; items: Discovery[] }>;
  /** Entities with at least `minListens` listens whose last listen is before `before`, most played first. */
  forgotten(query: {
    userId: UserId;
    entity: InsightEntity;
    before: number;
    minListens: number;
    limit: number;
  }): Promise<Forgotten[]>;
  /** Counts in `current` vs `previous`, for entities played in either. */
  compare(query: {
    userId: UserId;
    entity: InsightEntity;
    current: TimeWindow;
    previous: TimeWindow;
    limit: number;
    order: "rising" | "falling" | "current";
  }): Promise<Trend[]>;
  /** Tracks played exactly once in the window. */
  oneShots(
    query: InsightQuery & { limit: number },
  ): Promise<{ total: number; items: EntityCount[] }>;
  /** Totals for one artist, track or album; null when never played in the window. */
  entity(query: InsightQuery & { key: EntityKey }): Promise<EntityDetail | null>;
  albumTracks(query: InsightQuery & { key: EntityKey }): Promise<AlbumTrack[]>;
  /** Listen counts of one artist / track / album (or all listens without `key`) per month or year. */
  timeline(
    query: InsightQuery & { key?: EntityKey; bucket: "week" | "month" | "year" },
  ): Promise<BucketCount[]>;
  /** Top `limit` entities of each period. */
  chart(
    query: InsightQuery & {
      entity: InsightEntity;
      bucket: "week" | "month" | "year";
      limit: number;
    },
  ): Promise<ChartEntry[]>;
  diversity(query: InsightQuery): Promise<Diversity>;
  /** A session ends after `gapSeconds` without a listen. */
  sessions(query: InsightQuery & { gapSeconds: number }): Promise<SessionStats>;
  /** Tracks played several times in a row, longest runs first. */
  repeats(query: InsightQuery & { limit: number }): Promise<Repeat[]>;
  /** The n-th listen of all time for each n (absent when the user has fewer listens). */
  milestones(query: { userId: UserId; ns: number[] }): Promise<Milestone[]>;
  /** Top tracks within each window (one per past year for "on this day"). */
  topInWindows(query: {
    userId: UserId;
    windows: TimeWindow[];
    limit: number;
  }): Promise<{ listenCount: number; items: EntityCount[] }[]>;
}

/**
 * Loved tracks ("coups de cœur", one row per artist + title) and the current obsession (at most one track
 * per user, shown on the profile). Both are keyed by names, like listens, so they survive re-imports.
 */
export interface FavouriteRepository {
  /** Adds or refreshes a loved track. */
  love(userId: UserId, track: FavouriteTrack): Promise<void>;
  unlove(userId: UserId, artistName: string, trackName: string): Promise<void>;
  /** Newest first. */
  loved(
    userId: UserId,
    limit: number,
    offset: number,
  ): Promise<{ items: FavouriteTrack[]; total: number }>;
  /** Replaces the obsession, or clears it with null. */
  setObsession(userId: UserId, track: FavouriteTrack | null): Promise<void>;
  obsession(userId: UserId): Promise<FavouriteTrack | null>;
}

/** Instance-wide settings and the facts they depend on. Every method is one indexed read or write. */
export interface InstanceRepository {
  /** Whether any account exists, and the value of one setting (null when unset), in one round trip. */
  hasUsersAndSetting(key: string): Promise<[boolean, string | null]>;
  setSetting(key: string, value: string): Promise<void>;
  /** The first account's profile id (the instance owner), or null on an empty instance. */
  ownerUserId(): Promise<UserId | null>;
}

/** Which artist names a library uses, and the aliases learned for names that arrive in several forms. */
export interface ArtistRepository {
  /** The subset of `names` that the user already has listens under. One indexed lookup per name, one round trip. */
  known(userId: UserId, names: string[]): Promise<Set<string>>;
  aliases(names: string[]): Promise<Map<string, string>>;
  learnAliases(pairs: [alias: string, artist: string][]): Promise<void>;
  /** Which (artist, album) pairs the user already has listens under, as `artist\u0000album` keys. */
  knownAlbums(userId: UserId, pairs: [artist: string, album: string][]): Promise<Set<string>>;
}

export interface Repositories {
  users: UserRepository;
  favourites: FavouriteRepository;
  listens: ListenRepository;
  playingNow: PlayingNowRepository;
  imports: ImportRepository;
  stats: StatsRepository;
  insights: InsightsRepository;
  instance: InstanceRepository;
  artists: ArtistRepository;
}

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

/** Returns the current time in Unix seconds. Injected so tests control time. */
export type Clock = () => number;

export const systemClock: Clock = () => Math.floor(Date.now() / 1000);
