/**
 * Ports: the only way core talks to the outside world.
 * A storage adapter (D1, Postgres, SQLite...) implements `Repositories`;
 * a cache adapter (KV, memory...) implements `Cache`.
 */
import type {
  ListenPage,
  ListenQuery,
  NewListen,
  PlayingNow,
  TopQuery,
  TopResult,
  User,
  UserId,
} from "@scrobbler/types";

export interface UserRepository {
  findByName(name: string): Promise<User | null>;
  /** Returns null when the name is already taken (case-insensitive). */
  create(name: string, createdAt: number): Promise<User | null>;
}

export interface TokenRepository {
  /** `tokenHash` is the hex SHA-256 of the raw token; raw tokens are never stored. */
  findUserByTokenHash(tokenHash: string): Promise<User | null>;
  add(userId: UserId, tokenHash: string, createdAt: number): Promise<void>;
  revokeAll(userId: UserId): Promise<void>;
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
}

export interface Repositories {
  users: UserRepository;
  tokens: TokenRepository;
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
