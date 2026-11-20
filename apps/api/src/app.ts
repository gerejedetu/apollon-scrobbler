import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./env.ts";
import { container } from "./http/container.ts";
import { notFound, onError } from "./http/errors.ts";
import { authRoutes } from "./routes/auth.ts";
import { importRoutes } from "./routes/imports.ts";
import { listensRoutes } from "./routes/listens.ts";
import { statsRoutes } from "./routes/stats.ts";
import { tokenRoutes } from "./routes/tokens.ts";

/** ListenBrainz API v1, served under `/1`, the path clients append to their configured API root. */
function listenBrainzApi() {
  return new Hono<AppEnv>()
    .use(
      "*",
      cors({
        origin: "*",
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["GET", "POST", "OPTIONS"],
      }),
    )
    .route("/", tokenRoutes)
    .route("/", listensRoutes)
    .route("/", importRoutes)
    .route("/", statsRoutes);
}

export function createApp() {
  const app = new Hono<AppEnv>();
  app.onError(onError);
  app.notFound(notFound);
  app.use("*", container);
  app.get("/", (c) => c.json({ name: "scrobbler", api: "/1", auth: "/api/auth" }));
  app.route("/1", listenBrainzApi());
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
