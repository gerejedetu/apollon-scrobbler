import type { User } from "@scrobbler/types";
import { ApiError } from "@scrobbler/core";
import type { Context } from "hono";
import type { AppEnv } from "../env.ts";

/** The token owner of this request (`Authorization: Token|Bearer <token>`), or a 401. */
export function requireUser(c: Context<AppEnv>): Promise<User> {
  return c.var.services.auth.requireUser(c.req.header("authorization"));
}

/**
 * Like `requireUser`, but without an Authorization header falls back to the Better Auth session cookie,
 * so the web front can call the native API as the signed-in user.
 */
export async function requireUserOrSession(c: Context<AppEnv>): Promise<User> {
  if (c.req.header("authorization")) return requireUser(c);
  const session = await c.var.auth().api.getSession({ headers: c.req.raw.headers });
  if (!session) throw ApiError.unauthorized("Sign in or provide an Authorization header.");
  return c.var.services.users.requireByAuthId(session.user.id);
}
