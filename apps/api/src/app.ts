import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./env.ts";
import { type ContainerOptions, createContainer } from "./http/container.ts";
import { notFound, onError } from "./http/errors.ts";
import { MemoryRateLimiter, rateLimit } from "./http/rate-limit.ts";
import { listenBrainzApi } from "./protocols/listenbrainz/index.ts";
import { nativeApi } from "./protocols/native/index.ts";
import { authRoutes } from "./routes/auth.ts";

/** Same limits as wrangler.jsonc `ratelimits`, enforced per isolate as a backstop. */
export const API_LIMIT_PER_MINUTE = 600;
export const AUTH_LIMIT_PER_MINUTE = 10;

export function createApp(options: ContainerOptions = {}) {
  const app = new Hono<AppEnv>();
  const apiLimiter = new MemoryRateLimiter(API_LIMIT_PER_MINUTE);
  const authLimiter = new MemoryRateLimiter(AUTH_LIMIT_PER_MINUTE);
  app.onError(onError);
  app.notFound(notFound);
  app.use("*", createContainer(options));
  app.get("/", (c) =>
    c.json({
      name: "scrobbler",
      api: "/v1",
      openapi: "/v1/openapi.json",
      docs: "/v1/docs",
      listenbrainz: "/1",
      auth: "/api/auth",
    }),
  );
  app.use(
    "/1/*",
    rateLimit((env) => env.RATE_LIMIT_API, apiLimiter),
  );
  app.use(
    "/v1/*",
    rateLimit((env) => env.RATE_LIMIT_API, apiLimiter),
  );
  app.use(
    "/api/auth/sign-up/*",
    rateLimit((env) => env.RATE_LIMIT_AUTH, authLimiter),
  );
  app.use(
    "/api/auth/sign-in/*",
    rateLimit((env) => env.RATE_LIMIT_AUTH, authLimiter),
  );
  app.route("/1", listenBrainzApi);
  app.route("/v1", nativeApi);
  app.use(
    "/api/auth/*",
    cors({
      origin: (origin, c) =>
        (c.env.TRUSTED_ORIGINS ?? "")
          .split(",")
          .map((o: string) => o.trim())
          .includes(origin)
          ? origin
          : null,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );
  app.route("/api/auth", authRoutes);
  return app;
}
