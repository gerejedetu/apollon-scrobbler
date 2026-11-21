/**
 * The native API as one caller sees it: every request carries that caller's `Authorization` header, so the
 * API applies its own rules (token check, private profiles, rate limits) exactly as for any other client.
 */
import { createEndpoints, createHttp, type Endpoints, type Transport } from "@scrobbler/client";
import type { Bindings } from "../env.ts";

/** Origin used for requests through the service binding; the API only reads the path. */
const BINDING_ORIGIN = "https://api.internal";

export function apiTransport(env: Bindings, authorization: string): Transport {
  const origin = env.API ? BINDING_ORIGIN : env.API_ORIGIN;
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

export function connectApi(env: Bindings, authorization: string): Endpoints {
  return createEndpoints(createHttp(apiTransport(env, authorization)));
}
