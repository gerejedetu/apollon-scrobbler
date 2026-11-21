/**
 * HTTP side of the server: Streamable HTTP at `/mcp`, stateless (each POST is answered on its own with JSON),
 * so there is no session to store and any isolate can answer. The token is checked before anything else.
 */
import { ApiError } from "@scrobbler/client";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { connectApi } from "../api/connect.ts";
import type { Bindings } from "../env.ts";
import { createMcpServer, SERVER_INFO } from "../server.ts";
import { apiAuthorization, unauthorized } from "./auth.ts";
import { memoryViewerCache, resolveViewer, type ViewerCache } from "./viewer.ts";

export const MCP_PATH = "/mcp";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers":
    "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id",
  "access-control-expose-headers": "mcp-session-id, www-authenticate",
  "access-control-max-age": "86400",
};

function withCors(response: Response): Response {
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
  return out;
}

function rpcError(status: number, message: string, headers: Record<string, string> = {}) {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message }, id: null },
    { status, headers },
  );
}

export function createHandler(cache: ViewerCache = memoryViewerCache()) {
  async function handleMcp(request: Request, env: Bindings): Promise<Response> {
    // Stateless: no server-initiated stream to open (GET) and no session to end (DELETE).
    if (request.method !== "POST")
      return rpcError(405, "Method not allowed.", { allow: "POST, OPTIONS" });
    const url = new URL(request.url);
    const authorization = apiAuthorization(request.headers.get("authorization"));
    if (!authorization)
      return unauthorized(
        "Sign in through OAuth, or send an Apollon API token as `Authorization: Bearer <token>`.",
        url,
      );

    const api = connectApi(env, authorization, url.origin);
    let me;
    try {
      me = await resolveViewer(api, authorization, cache);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401)
        return unauthorized("Invalid, expired or revoked token.", url, true);
      if (e instanceof ApiError && e.status === 429) return rpcError(429, "Too many requests.");
      throw e;
    }

    const server = createMcpServer({ api, me });
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    return transport.handleRequest(request);
  }

  return async function fetch(request: Request, env: Bindings): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === MCP_PATH || pathname === `${MCP_PATH}/`) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      try {
        return withCors(await handleMcp(request, env));
      } catch (e) {
        console.error("mcp request failed", e);
        return withCors(rpcError(502, "The Apollon API could not be reached."));
      }
    }
    if (pathname === "/" && request.method === "GET")
      return Response.json({ ...SERVER_INFO, transport: "streamable-http", endpoint: MCP_PATH });
    return Response.json(
      { code: 404, error: "Not found. The MCP endpoint is /mcp." },
      { status: 404 },
    );
  };
}
