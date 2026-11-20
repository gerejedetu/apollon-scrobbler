/**
 * Request rate limits. They cap how many D1 reads and KV writes one client can cause, so a buggy
 * scrobbler or a scraper cannot run up the bill. Two layers, both free:
 * - Cloudflare's Rate Limiting binding, shared across isolates (when it is available and enforcing);
 * - an in-memory fixed window per isolate, which always works: one client's requests mostly land on the
 *   same location and isolate, so it stops floods even where the binding is permissive.
 */
import { sha256Hex } from "@scrobbler/core";
import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv, RateLimiter } from "../env.ts";

/** Token owners are limited per token (several scrobblers behind one IP stay independent), others per IP. */
async function clientKey(c: Context<AppEnv>): Promise<string> {
  const auth = c.req.header("authorization");
  if (auth) return `t:${(await sha256Hex(auth)).slice(0, 32)}`;
  return `ip:${c.req.header("cf-connecting-ip") ?? "unknown"}`;
}

/** Fixed-window counter living in the isolate. Bounded: at most `maxKeys` clients tracked at once. */
export class MemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly max: number,
    private readonly periodMs = 60_000,
    private readonly now: () => number = Date.now,
    private readonly maxKeys = 10_000,
  ) {}

  async limit({ key }: { key: string }): Promise<{ success: boolean }> {
    const now = this.now();
    let w = this.windows.get(key);
    if (!w || w.resetAt <= now) {
      if (!w && this.windows.size >= this.maxKeys) {
        for (const [k, v] of this.windows) if (v.resetAt <= now) this.windows.delete(k);
        const oldest = this.windows.keys().next().value;
        if (this.windows.size >= this.maxKeys && oldest !== undefined) this.windows.delete(oldest);
      }
      w = { count: 0, resetAt: now + this.periodMs };
      this.windows.set(key, w);
    }
    w.count++;
    return { success: w.count <= this.max };
  }
}

export function rateLimit(
  pick: (env: AppEnv["Bindings"]) => RateLimiter | undefined,
  local: RateLimiter,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (c.req.method !== "OPTIONS") {
      const key = await clientKey(c);
      const shared = pick(c.env);
      const [a, b] = await Promise.all([
        local.limit({ key }),
        shared ? shared.limit({ key }) : Promise.resolve({ success: true }),
      ]);
      if (!a.success || !b.success) {
        c.header("Retry-After", "60");
        return c.json(
          { code: 429, error: "Too many requests, slow down and retry in a minute." },
          429,
        );
      }
    }
    await next();
  };
}
