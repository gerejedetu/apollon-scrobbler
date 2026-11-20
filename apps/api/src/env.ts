import type { Auth } from "@scrobbler/auth";
import type { KVLike } from "@scrobbler/cache-kv";
import type { Services } from "@scrobbler/core";
import type { D1Like } from "@scrobbler/db-d1";

/** Worker bindings (see wrangler.jsonc). Typed structurally so tests can pass doubles. */
export interface Bindings {
  DB: D1Like;
  CACHE?: KVLike;
  BETTER_AUTH_SECRET: string;
  /** Public URL of the Worker; defaults to the request's origin. */
  BASE_URL?: string;
  TRUSTED_ORIGINS?: string;
  DISABLE_SIGNUP?: string;
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
