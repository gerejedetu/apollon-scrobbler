/** Better Auth's endpoints (sign-up, sign-in, sessions, API keys) under `/api/auth/*`. */
import { Hono } from "hono";
import type { AppEnv } from "../env.ts";

export const authRoutes = new Hono<AppEnv>().on(["GET", "POST"], "/*", (c) =>
  c.var.auth().handler(c.req.raw),
);
