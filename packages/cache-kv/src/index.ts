import type { Cache } from "@scrobbler/core";

/** The subset of a Workers KV namespace used here, typed structurally. */
export interface KVLike {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/** KV refuses TTLs under 60 seconds. */
const MIN_TTL = 60;

/**
 * Core `Cache` on Workers KV. Reads are fast and cheap at the edge; writes are eventually consistent
 * (up to ~60 s across locations), which is fine for derived data such as stats.
 * Cache failures never fail a request: they behave as a miss.
 */
export class KvCache implements Cache {
  constructor(
    private readonly kv: KVLike,
    private readonly prefix = "",
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      return ((await this.kv.get(this.prefix + key, "json")) as T | null) ?? null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.kv.put(this.prefix + key, JSON.stringify(value), {
        expirationTtl: Math.max(ttlSeconds, MIN_TTL),
      });
    } catch {
      // A failed cache write only costs a recomputation later.
    }
  }
}
