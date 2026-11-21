/**
 * The OAuth flow of MCP clients goes through our sign-in and consent pages: Better Auth sends the browser there
 * with a signed query (`sig`), and answers the next call with `{ redirect: true, url }` to continue.
 */

/** The signed authorization query Better Auth adds when it sends the browser to one of our pages. */
export function isOAuthRequest(search: Record<string, unknown>): boolean {
  return typeof search.sig === "string" && typeof search.client_id === "string";
}

/** Where to go next when a Better Auth answer continues an authorization, else null. */
export function oauthRedirect(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const { redirect, url } = data as { redirect?: unknown; url?: unknown };
  if (redirect !== true || typeof url !== "string") return null;
  // Absolute (back to the client, e.g. claude.ai) or one of our own pages (the consent page after sign-in).
  return /^https?:\/\//.test(url) || (url.startsWith("/") && !url.startsWith("//")) ? url : null;
}
