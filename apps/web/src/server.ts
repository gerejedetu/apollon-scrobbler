/**
 * Worker entry: API paths are relayed to the API Worker, /covers finds artwork by name, everything else is
 * rendered by TanStack Start in the visitor's language (Paraglide).
 */
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { COVERS_PATH, handleCovers } from "./edge/covers.ts";
import { apiTarget } from "./edge/env.ts";
import { forwardToApi, isApiPath } from "./edge/proxy.ts";
import { workerEnv } from "./edge/runtime.ts";
import { paraglideMiddleware } from "./paraglide/server.js";

export default createServerEntry({
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === COVERS_PATH) {
      return handleCovers(request, {
        bucket: (await workerEnv()).ARTWORK,
        cache: (globalThis.caches as { default?: Cache } | undefined)?.default,
      });
    }
    if (isApiPath(pathname)) {
      return forwardToApi(request, apiTarget(await workerEnv()));
    }
    // Pages render in the visitor's language (cookie, then the browser's preference, then French).
    return paraglideMiddleware(request, () => handler.fetch(request));
  },
});
