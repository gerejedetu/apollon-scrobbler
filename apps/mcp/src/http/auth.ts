/**
 * The MCP endpoint takes either kind of user token, sent as `Authorization: Bearer <token>` (what MCP clients
 * send; `Token <token>` works too): an OAuth access token that the client got through the sign-in and consent
 * flow (claude.ai, Claude Desktop connectors…), or an API key pasted by hand. The API checks both.
 * Without a valid one, the 401 points to the protected-resource metadata so the client can start OAuth.
 */
const HEADER = /^(?:Bearer|Token)\s+(\S+)\s*$/i;

/** The header to forward to the API, normalised to `Token <token>`, or null when there is none. */
export function apiAuthorization(header: string | null): string | null {
  const token = header ? HEADER.exec(header)?.[1] : undefined;
  return token ? `Token ${token}` : null;
}

/** RFC 9728: where the MCP endpoint's metadata lives (path inserted after `/.well-known/...`). */
export function resourceMetadataUrl(mcpUrl: URL): string {
  return `${mcpUrl.origin}/.well-known/oauth-protected-resource${mcpUrl.pathname.replace(/\/$/, "")}`;
}

export function unauthorized(message: string, mcpUrl: URL, invalidToken = false): Response {
  const params = [
    'realm="apollon"',
    `resource_metadata="${resourceMetadataUrl(mcpUrl)}"`,
    ...(invalidToken ? ['error="invalid_token"'] : []),
  ];
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32001, message }, id: null },
    { status: 401, headers: { "www-authenticate": `Bearer ${params.join(", ")}` } },
  );
}
