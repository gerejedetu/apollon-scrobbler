import type { ApiTarget } from "./proxy.ts";

/** Bindings of the web Worker (see wrangler.jsonc). */
export interface WebEnv {
  /** Service binding to the API Worker. */
  API?: { fetch(request: Request): Promise<Response> };
  /** Local dev without the binding: where the API runs (in .dev.vars, never committed). */
  API_ORIGIN?: string;
}

/** API_ORIGIN, when set (local dev), wins over the binding: `vp dev` has no API Worker to bind to. */
export function apiTarget(env: WebEnv): ApiTarget {
  return env.API_ORIGIN ? { origin: env.API_ORIGIN } : { binding: env.API };
}
