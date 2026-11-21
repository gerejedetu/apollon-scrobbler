/** The API as the app uses it. Components and routes import from here, never from transport. */
import { createEndpoints, createHttp } from "@scrobbler/client";
import { transport } from "./transport.ts";

export const api = createEndpoints(createHttp(transport));
export { ApiError, isNotFound, isUnauthorized } from "@scrobbler/client";
export type * from "@scrobbler/client";
