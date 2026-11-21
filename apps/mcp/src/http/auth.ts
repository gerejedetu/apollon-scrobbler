/**
 * The MCP endpoint takes the same user token as ListenBrainz clients: `Authorization: Bearer <token>`
 * (what MCP clients send) or `Token <token>` (ListenBrainz style). Anything else is a 401.
 */
const HEADER = /^(?:Bearer|Token)\s+(\S+)\s*$/i;

/** The header to forward to the API, normalised to `Token <token>`, or null when there is none. */
export function apiAuthorization(header: string | null): string | null {
  const token = header ? HEADER.exec(header)?.[1] : undefined;
  return token ? `Token ${token}` : null;
}

export function unauthorized(message: string): Response {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32001, message }, id: null },
    {
      status: 401,
      headers: { "www-authenticate": 'Bearer realm="apollon", error="invalid_token"' },
    },
  );
}
