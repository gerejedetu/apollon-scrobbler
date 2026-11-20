/**
 * Ports: the only way core talks to the outside world.
 * A storage adapter (D1, Postgres, SQLite...) implements `Repositories`;
 * an identity provider (Better Auth) implements `TokenVerifier`;
 * a cache adapter (KV, memory...) implements `Cache`.
 */
import type {
  ActivityQuery,
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

export interface Repositories {
  users: UserRepository;
  listens: ListenRepository;
  playingNow: PlayingNowRepository;
  imports: ImportRepository;
  stats: StatsRepository;
}

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

/** Returns the current time in Unix seconds. Injected so tests control time. */
export type Clock = () => number;

export const systemClock: Clock = () => Math.floor(Date.now() / 1000);
