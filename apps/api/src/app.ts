import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./env.ts";
import { container } from "./http/container.ts";
import { notFound, onError } from "./http/errors.ts";
import { listenBrainzApi } from "./protocols/listenbrainz/index.ts";
import { nativeApi } from "./protocols/native/index.ts";
import { authRoutes } from "./routes/auth.ts";

export function createApp() {
  const app = new Hono<AppEnv>();
  app.onError(onError);
  app.notFound(notFound);
  app.use("*", container);
  app.get("/", (c) =>
    c.json({
      name: "scrobbler",
      api: "/v1",
      openapi: "/v1/openapi.json",
      listenbrainz: "/1",
      auth: "/api/auth",
    }),
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
