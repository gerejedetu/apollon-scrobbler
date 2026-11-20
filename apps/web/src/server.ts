/** Worker entry: API paths are relayed to the API Worker, everything else is rendered by TanStack Start. */
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { apiTarget } from "./edge/env.ts";
import { forwardToApi, isApiPath } from "./edge/proxy.ts";
import { workerEnv } from "./edge/runtime.ts";

export default createServerEntry({
  async fetch(request) {
    if (isApiPath(new URL(request.url).pathname)) {
      return forwardToApi(request, apiTarget(await workerEnv()));
    }
    return handler.fetch(request);
  },
});
