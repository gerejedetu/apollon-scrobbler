/** `GET /1/validate-token`: lets clients check a token before scrobbling. */
import { ApiError, tokenFromHeader } from "@scrobbler/core";
import { Hono } from "hono";
import type { AppEnv } from "../../env.ts";

export const tokenRoutes = new Hono<AppEnv>().get("/validate-token", async (c) => {
  // Header first; the `?token=` query form is legacy ListenBrainz behaviour some clients still use.
  const raw = tokenFromHeader(c.req.header("authorization")) ?? c.req.query("token");
  if (!raw) throw ApiError.badRequest("You need to provide an Authorization token.");
  const user = await c.var.services.auth.authenticate(raw);
  if (!user) return c.json({ code: 200, message: "Token invalid.", valid: false });
  return c.json({ code: 200, message: "Token valid.", valid: true, user_name: user.name });
});
