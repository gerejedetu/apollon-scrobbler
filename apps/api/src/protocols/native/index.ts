/**
 * Native API, mounted at `/v1`: for clients written for this scrobbler (and the web front, which can
 * use its session cookie instead of a token). Documented at `/v1/openapi.json`.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "../../env.ts";
import { favouriteRoutes } from "./favourites.ts";
import { openApiDocument } from "./openapi.ts";
import { insightRoutes } from "./insights.ts";
import { nativeRoutes } from "./routes.ts";

export const nativeApi = new Hono<AppEnv>()
  .use(
    "*",
    cors({
      origin: "*",
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .get("/openapi.json", (c) => c.json(openApiDocument))
  // Interactive documentation of openapi.json (Scalar, pinned version, loaded from jsDelivr).
  .get("/docs", (c) =>
    c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Scrobbler API</title>
    <meta name="description" content="API reference of a self-hosted, ListenBrainz-compatible music scrobbler." />
  </head>
  <body>
    <script id="api-reference" data-url="./openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.76.4"></script>
  </body>
</html>`),
  )
  .route("/", insightRoutes)
  .route("/", favouriteRoutes)
  .route("/", nativeRoutes);
