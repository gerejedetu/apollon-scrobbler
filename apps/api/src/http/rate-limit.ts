/**
 * Request rate limits, backed by Cloudflare's Rate Limiting binding (free, no storage to pay for).
 * They cap how many D1 reads and KV writes one client can cause, so a buggy scrobbler or a scraper
 * cannot run up the bill. Without the binding (tests, other hosts) the middleware lets everything through.
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

export function rateLimit(
  pick: (env: AppEnv["Bindings"]) => RateLimiter | undefined,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const limiter = pick(c.env);
    if (limiter && c.req.method !== "OPTIONS") {
      const { success } = await limiter.limit({ key: await clientKey(c) });
      if (!success) {
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
