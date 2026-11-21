/** Worker bindings (see wrangler.jsonc). Typed structurally so tests can pass doubles. */
export interface Bindings {
  /** Service binding to the API Worker (production). */
  API?: { fetch(request: Request): Promise<Response> };
  /** Plain origin of the API, used when there is no binding (local dev, tests). */
  API_ORIGIN?: string;
}
