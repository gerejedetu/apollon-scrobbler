/**
 * Native API, mounted at `/v1`: for clients written for this scrobbler (and the web front, which can
 * use its session cookie instead of a token). Documented at `/v1/openapi.json`.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "../../env.ts";
import { openApiDocument } from "./openapi.ts";
import { nativeRoutes } from "./routes.ts";

export const nativeApi = new Hono<AppEnv>()
  .use(
    "*",
    cors({
      origin: "*",
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  )
  .get("/openapi.json", (c) => c.json(openApiDocument))
  .route("/", nativeRoutes);
