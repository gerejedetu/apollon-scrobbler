/**
 * Composition root: wires adapters (Turso or D1, KV, Better Auth) into core services for one request.
 * This is the only file of the API that knows which concrete adapters are used.
 */
import { createAuth, mcpResource, tokenVerifier, type Auth } from "@scrobbler/auth";
import { KvCache } from "@scrobbler/cache-kv";
import { type Clock, createServices, MemoryCache, type Services } from "@scrobbler/core";
import { createClient } from "@libsql/client/web";
import { createD1Repositories, type D1Like } from "@scrobbler/db-d1";
import { LibsqlDriver } from "@scrobbler/db-libsql";
import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv, Bindings } from "../env.ts";

/** One libSQL client per isolate (HTTP, no socket to keep), reused across requests. */
let turso: { url: string; driver: LibsqlDriver } | undefined;

/**
 * The SQL database: Turso when TURSO_DATABASE_URL is set, else the D1 binding. Both speak the same
 * D1-shaped API, so repositories and Better Auth are identical on either.
 */
function database(env: Bindings): D1Like {
  if (env.TURSO_DATABASE_URL) {
    if (turso?.url !== env.TURSO_DATABASE_URL) {
      const client = createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
        intMode: "number",
      });
      turso = { url: env.TURSO_DATABASE_URL, driver: new LibsqlDriver(client) };
    }
    return turso.driver;
  }
  if (!env.DB) throw new Error("No database: set TURSO_DATABASE_URL or bind a D1 database as DB.");
  return env.DB;
}

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
  db: D1Like,
  baseURL: string,
  services: () => Services,
  waitUntil?: (p: Promise<unknown>) => void,
): Auth {
  return createAuth({
    // D1 or the libSQL driver, passed as-is: Better Auth detects a D1-style database and uses its SQLite dialect.
    database: db as never,
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins: (env.TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    disableSignUp: env.DISABLE_SIGNUP === "true",
    waitUntil,
    canSignUp: () => services().instance.signupOpen(),
    onAccountCreated: async ({ id, userName }) => {
      await services().users.createProfile(id, userName);
    },
  });
}

export interface ContainerOptions {
  /** Fixed clock for tests; production uses the system clock. */
  clock?: Clock;
}

export const createContainer =
  (options: ContainerOptions = {}): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const db = database(c.env);
    let auth: Auth | undefined;
    const baseURL = c.env.BASE_URL || new URL(c.req.url).origin;
    const getAuth = () => (auth ??= buildAuth(c.env, db, baseURL, () => services, waitUntilOf(c)));
    const services = createServices(
      createD1Repositories(db),
      // API keys, and OAuth access tokens that the MCP server forwards for its users.
      { verify: (raw) => tokenVerifier(getAuth(), mcpResource(baseURL)).verify(raw) },
      {
        cache: c.env.CACHE ? new KvCache(c.env.CACHE, "v1:") : undefined,
        authCache,
        clock: options.clock,
        signupForceClosed: c.env.DISABLE_SIGNUP === "true",
        cacheMinListens: c.env.CACHE_MIN_LISTENS
          ? Number(c.env.CACHE_MIN_LISTENS)
          : c.env.TURSO_DATABASE_URL
            ? 50_000
            : undefined,
      },
    );
    c.set("services", services);
    c.set("auth", getAuth);
    await next();
  };
