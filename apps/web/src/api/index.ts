/** The API as the app uses it. Components and routes import from here, never from transport or http. */
import { createEndpoints } from "./endpoints.ts";
import { createHttp } from "./http.ts";
import { transport } from "./transport.ts";

export const api = createEndpoints(createHttp(transport));
export { ApiError, isNotFound, isUnauthorized } from "./error.ts";
export type * from "./types.ts";
