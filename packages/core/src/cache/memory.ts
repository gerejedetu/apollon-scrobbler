import type { Cache } from "../ports/index.ts";

/**
 * In-memory cache with TTL and a size cap (oldest entries evicted first).
 * On Workers it lives as long as the isolate: good for hot, tiny lookups such as token checks.
 */
export class MemoryCache implements Cache {
  private readonly entries = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(
    private readonly maxEntries = 1000,
    private readonly now: () => number = Date.now,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.entries.delete(key);
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: this.now() + ttlSeconds * 1000 });
  }
}

/**
 * A fast per-isolate cache in front of a shared one (KV): reads try memory first and fill it from the
 * shared cache; writes go to both. Repeated requests on one isolate then cost neither a KV read nor a query.
 */
export class LayeredCache implements Cache {
  constructor(
    private readonly near: Cache,
    private readonly far: Cache,
    /** How long a value fetched from the far cache is kept near, in seconds. */
    private readonly nearTtl = 300,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const near = await this.near.get<T>(key);
    if (near !== null) return near;
    const far = await this.far.get<T>(key);
    if (far !== null) await this.near.set(key, far, this.nearTtl);
    return far;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await Promise.all([
      this.near.set(key, value, Math.min(ttlSeconds, this.nearTtl)),
      this.far.set(key, value, ttlSeconds),
    ]);
  }
}
