/**
 * The native API as one caller sees it: every request carries that caller's `Authorization` header, so the
 * API applies its own rules (token check, private profiles, rate limits) exactly as for any other client.
 */
import { createEndpoints, createHttp, type Endpoints, type Transport } from "@scrobbler/client";
import type { Bindings } from "../env.ts";

/**
 * Through the service binding, requests keep the public origin of the MCP endpoint (the web front's): the API
 * derives its OAuth issuer and the expected token audience (`<origin>/mcp`) from it.
 */
export function apiTransport(
  env: Bindings,
  authorization: string,
  publicOrigin: string,
): Transport {
  const origin = env.API ? publicOrigin : env.API_ORIGIN;
  return async (path, init = {}) => {
    if (!origin) {
      return Response.json(
        { code: 503, error: "No API configured: bind API or set API_ORIGIN." },
        { status: 503 },
      );
    }
    const headers = new Headers(init.headers);
    headers.set("authorization", authorization);
    const request = new Request(new URL(path, origin), { ...init, headers });
    return env.API ? env.API.fetch(request) : fetch(request);
  };
}

export function connectApi(env: Bindings, authorization: string, publicOrigin: string): Endpoints {
  return createEndpoints(createHttp(apiTransport(env, authorization, publicOrigin)));
}
