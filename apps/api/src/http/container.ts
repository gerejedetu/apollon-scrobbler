/**
 * Composition root: wires adapters (D1, KV, Better Auth) into core services for one request.
 * This is the only file of the API that knows which concrete adapters are used.
 */
import { apiKeyVerifier, createAuth, type Auth } from "@scrobbler/auth";
import { KvCache } from "@scrobbler/cache-kv";
import { createServices, MemoryCache, type Services } from "@scrobbler/core";
import { createD1Repositories } from "@scrobbler/db-d1";
import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv, Bindings } from "../env.ts";

/** Lives as long as the isolate: token checks are skipped for 60 s after a hit. */
const authCache = new MemoryCache(5000);

function waitUntilOf(c: Context<AppEnv>): ((p: Promise<unknown>) => void) | undefined {
  try {
    const ctx = c.executionCtx;
    return (p) => ctx.waitUntil(p);
  } catch {
    return undefined; // No execution context (tests): background work is simply awaited by Better Auth.
  }
}

function buildAuth(
  env: Bindings,
  origin: string,
  services: () => Services,
  waitUntil?: (p: Promise<unknown>) => void,
): Auth {
  return createAuth({
    // The D1 binding is passed as-is; Better Auth detects it and uses its D1 dialect.
    database: env.DB as never,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BASE_URL || origin,
    trustedOrigins: (env.TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    disableSignUp: env.DISABLE_SIGNUP === "true",
    waitUntil,
    onAccountCreated: async ({ id, userName }) => {
      await services().users.createProfile(id, userName);
    },
  });
}

export const container: MiddlewareHandler<AppEnv> = async (c, next) => {
  let auth: Auth | undefined;
  const getAuth = () =>
    (auth ??= buildAuth(c.env, new URL(c.req.url).origin, () => services, waitUntilOf(c)));
  const services = createServices(
    createD1Repositories(c.env.DB),
    { verify: (raw) => apiKeyVerifier(getAuth()).verify(raw) },
    { cache: c.env.CACHE ? new KvCache(c.env.CACHE, "v1:") : undefined, authCache },
  );
  c.set("services", services);
  c.set("auth", getAuth);
  await next();
};
