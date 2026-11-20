/**
 * Worker entry: API paths are relayed to the API Worker, /covers finds artwork by name, everything else is
 * rendered by TanStack Start.
 */
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { COVERS_PATH, handleCovers } from "./edge/covers.ts";
import { apiTarget } from "./edge/env.ts";
import { forwardToApi, isApiPath } from "./edge/proxy.ts";
import { workerEnv } from "./edge/runtime.ts";

export default createServerEntry({
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === COVERS_PATH) {
      return handleCovers(request, {
        cache: (globalThis.caches as { default?: Cache } | undefined)?.default,
      });
    }
    if (isApiPath(pathname)) {
      return forwardToApi(request, apiTarget(await workerEnv()));
    }
    return handler.fetch(request);
  },
});
