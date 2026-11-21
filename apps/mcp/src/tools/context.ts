import type { Endpoints, Me } from "@scrobbler/client";

/** What every tool gets: the API as the caller, and who the caller is (their own data is the default). */
export interface ToolContext {
  api: Endpoints;
  me: Me;
}
