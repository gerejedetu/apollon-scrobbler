/**
 * OAuth discovery documents at the root of the origin, where MCP clients look for them (RFC 8414, RFC 9728,
 * OpenID Connect). Better Auth lives under /api/auth, so these root paths are handed to it as they are: its
 * MCP plugin answers the issuer-inserted forms (`/.well-known/oauth-authorization-server/api/auth`) and the
 * protected-resource metadata of the MCP server (`/.well-known/oauth-protected-resource/mcp`).
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "../env.ts";

export const WELL_KNOWN_PREFIXES = [
  "/oauth-authorization-server",
  "/oauth-protected-resource",
  "/openid-configuration",
] as const;

export const wellKnownRoutes = new Hono<AppEnv>()
  // Public documents: any origin may read them, never with credentials.
  .use("*", cors({ origin: "*", allowMethods: ["GET", "HEAD", "OPTIONS"] }))
  .on(["GET", "HEAD"], "/*", async (c) => {
    const path = c.req.path.replace(/^\/\.well-known/, "");
    if (!WELL_KNOWN_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`)))
      return c.notFound();
    return c.var.auth().handler(c.req.raw);
  });
