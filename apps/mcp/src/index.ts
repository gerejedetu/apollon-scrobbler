/** Worker entry: the Apollon MCP server (see src/http/handler.ts). */
import type { Bindings } from "./env.ts";
import { createHandler } from "./http/handler.ts";

const handle = createHandler();

export default {
  fetch: (request: Request, env: Bindings) => handle(request, env),
};
