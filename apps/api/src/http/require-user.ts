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

/**
 * Who is reading, if anyone: the token owner, else the session user, else null (anonymous).
 * A wrong token is still a 401, so clients learn their token is bad instead of silently reading as anonymous.
 */
export async function optionalViewer(c: Context<AppEnv>): Promise<User | null> {
  if (c.req.header("authorization")) return requireUser(c);
  const cookie = c.req.header("cookie");
  if (!cookie?.includes("session_token")) return null;
  const session = await c.var.auth().api.getSession({ headers: c.req.raw.headers });
  return session ? c.var.services.users.requireByAuthId(session.user.id) : null;
}

/** The user named in the path, if the current viewer may read them (private profiles 404 for others). */
export async function readableUser(c: Context<AppEnv>, name: string): Promise<User> {
  return c.var.services.users.requireReadable(name, await optionalViewer(c));
}
