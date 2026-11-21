/**
 * The web Worker answers on the same origin as the API, so Better Auth's session cookie is first-party:
 * these paths go to the API Worker untouched (service binding in production, API_ORIGIN in local dev).
 */
const API_PREFIXES = [
  "/api/auth/",
  "/v1/",
  "/1/",
  // OAuth discovery for MCP clients (the API hands them to Better Auth).
  "/.well-known/oauth-authorization-server",
  "/.well-known/oauth-protected-resource",
  "/.well-known/openid-configuration",
] as const;
const API_EXACT = new Set(["/v1", "/1"]);

export function isApiPath(pathname: string): boolean {
  return API_EXACT.has(pathname) || API_PREFIXES.some((p) => pathname.startsWith(p));
}

/** Where API requests go: a service binding (`API`) or, without one, a plain origin. */
export interface ApiTarget {
  binding?: { fetch(request: Request): Promise<Response> };
  origin?: string;
}

/**
 * Sends `request` to the API. The URL keeps the web origin when going through the binding, so the API sees
 * the origin the browser used (Better Auth derives its base URL and origin checks from it).
 */
export function forwardToApi(request: Request, target: ApiTarget): Promise<Response> {
  if (target.binding) return target.binding.fetch(request);
  if (!target.origin) {
    return Promise.resolve(
      Response.json(
        { code: 503, error: "No API configured: bind API or set API_ORIGIN." },
        { status: 503 },
      ),
    );
  }
  const url = new URL(request.url);
  const upstream = new URL(url.pathname + url.search, target.origin);
  return fetch(new Request(upstream, request));
}
