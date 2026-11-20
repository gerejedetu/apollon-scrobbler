/** An in-memory stand-in for a Workers KV namespace (get/put with expirationTtl). */
export class MemoryKV {
  private readonly store = new Map<string, { value: string; expiresAt: number | null }>();
  reads = 0;
  writes = 0;

  constructor(private readonly now: () => number = Date.now) {}

  async get(key: string, type?: "text" | "json"): Promise<unknown> {
    this.reads++;
    const e = this.store.get(key);
    if (!e || (e.expiresAt !== null && e.expiresAt <= this.now())) return null;
    return type === "json" ? JSON.parse(e.value) : e.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.writes++;
    const ttl = options?.expirationTtl;
    this.store.set(key, { value, expiresAt: ttl ? this.now() + ttl * 1000 : null });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
