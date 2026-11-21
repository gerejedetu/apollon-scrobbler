/**
 * Typed client of the native API (/v1). Bring a transport (browser fetch, a service binding, a test double):
 * `createEndpoints(createHttp(transport))`.
 */
export { createEndpoints, type Endpoints } from "./endpoints.ts";
export { ApiError, isNotFound, isUnauthorized } from "./error.ts";
export { createHttp, segment, withQuery, type Http, type Query, type Transport } from "./http.ts";
export type * from "./types.ts";
