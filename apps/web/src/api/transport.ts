/**
 * How a request reaches the API. In the browser it is a same-origin fetch (the session cookie goes along);
 * during server rendering it goes straight to the API Worker with the incoming request's cookie.
 */
import type { Transport } from "@scrobbler/client";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { apiTarget } from "../edge/env.ts";
import { forwardToApi } from "../edge/proxy.ts";
import { workerEnv } from "../edge/runtime.ts";

export const transport: Transport = createIsomorphicFn()
  .server(async (path: string, init?: RequestInit) => {
    const incoming = getRequest();
    const headers = new Headers(init?.headers);
    const cookie = incoming.headers.get("cookie");
    if (cookie) headers.set("cookie", cookie);
    const request = new Request(new URL(path, incoming.url), { ...init, headers });
    return forwardToApi(request, apiTarget(await workerEnv()));
  })
  .client(async (path: string, init?: RequestInit) => {
    const request = () => fetch(path, { credentials: "same-origin", ...init });
    const method = (init?.method ?? "GET").toUpperCase();
    if (method !== "GET") return request();
    // A read cut short (network blip, Worker restarting during a deploy) is tried again once before
    // it becomes an error screen. Writes are never replayed.
    try {
      const response = await request();
      if (![502, 503, 504].includes(response.status)) return response;
    } catch (e) {
      if (init?.signal?.aborted) throw e;
    }
    await new Promise((r) => setTimeout(r, 400));
    return request();
  });
