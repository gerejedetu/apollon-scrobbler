/**
 * ListenBrainz API v1, mounted at `/1`: the path ListenBrainz clients append to the API root they are
 * configured with, so any of them can point at this server instead of listenbrainz.org.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "../../env.ts";
import { importRoutes } from "./imports.ts";
import { listensRoutes } from "./listens.ts";
import { statsRoutes } from "./stats.ts";
import { tokenRoutes } from "./tokens.ts";

export const listenBrainzApi = new Hono<AppEnv>()
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
