import type { Auth } from "@scrobbler/auth";
import type { KVLike } from "@scrobbler/cache-kv";
import type { Services } from "@scrobbler/core";
import type { D1Like } from "@scrobbler/db-d1";

/** Cloudflare's Rate Limiting binding (see wrangler.jsonc `ratelimits`). */
export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** Worker bindings (see wrangler.jsonc). Typed structurally so tests can pass doubles. */
export interface Bindings {
  /** Cloudflare D1. Used when no Turso database is configured. */
  DB?: D1Like;
  /** Turso (libSQL) database URL, e.g. libsql://<db>-<org>.turso.io. When set, it is used instead of D1. Secret. */
  TURSO_DATABASE_URL?: string;
  /** Turso auth token for that database. Secret. */
  TURSO_AUTH_TOKEN?: string;
  /**
   * Histories smaller than this skip the KV stats cache (recomputing is cheaper than a KV write).
   * Default: 5000 on D1, 50000 on Turso, whose row reads cost far less than KV writes.
   */
  CACHE_MIN_LISTENS?: string;
  CACHE?: KVLike;
  BETTER_AUTH_SECRET: string;
  /** Public URL of the Worker; defaults to the request's origin. */
  BASE_URL?: string;
  TRUSTED_ORIGINS?: string;
  DISABLE_SIGNUP?: string;
  /** Limits every /1 and /v1 call, per token or per IP. */
  RATE_LIMIT_API?: RateLimiter;
  /** Stricter limit on account creation and sign-in, per IP. */
  RATE_LIMIT_AUTH?: RateLimiter;
}

export interface Variables {
  services: Services;
  /** Better Auth, created on first use in the request (most API calls never need it). */
  auth: () => Auth;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: Variables;
}
