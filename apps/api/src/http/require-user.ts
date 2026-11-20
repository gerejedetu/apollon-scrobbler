import type { User } from "@scrobbler/types";
import type { Context } from "hono";
import type { AppEnv } from "../env.ts";

/** The token owner of this request (`Authorization: Token <token>`), or a 401. */
export function requireUser(c: Context<AppEnv>): Promise<User> {
  return c.var.services.auth.requireUser(c.req.header("authorization"));
}
