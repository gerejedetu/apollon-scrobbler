/**
 * The OAuth flow an MCP client runs, as test steps: dynamic registration, authorize with the user's session,
 * consent, then the code exchange with PKCE. Shared by the API's and the MCP server's tests.
 */
import { createHash, randomBytes } from "node:crypto";
import { expect } from "vite-plus/test";
import type { TestApi } from "./helpers.ts";

const ORIGIN = "http://localhost";
const RESOURCE = `${ORIGIN}/mcp`;
const REDIRECT = "http://127.0.0.1:6274/callback";

const b64url = (b: Buffer) => b.toString("base64url");

export async function registerOAuthClient(api: TestApi) {
  const res = await api.json("/api/auth/oauth2/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Test assistant",
      redirect_uris: [REDIRECT],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body.client_id as string;
}

export function authorizeUrl(clientId: string, challenge: string) {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT,
    scope: "openid offline_access",
    state: "state-123",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: RESOURCE,
  });
  return `/api/auth/oauth2/authorize?${q}`;
}

/** Runs the whole flow as the user of `cookie` and returns the token response. */
export async function obtainOAuthToken(api: TestApi, cookie: string) {
  const clientId = await registerOAuthClient(api);
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  const authorize = await api.request(authorizeUrl(clientId, challenge), { headers: { cookie } });
  expect(authorize.status).toBe(302);
  const consentPage = new URL(authorize.headers.get("location")!, ORIGIN);
  expect(consentPage.pathname).toBe("/autoriser");

  const consent = await api.json("/api/auth/oauth2/consent", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ accept: true, oauth_query: consentPage.search.slice(1) }),
  });
  expect(consent.status, JSON.stringify(consent.body)).toBe(200);
  const back = new URL(consent.body.url);
  expect(back.searchParams.get("state")).toBe("state-123");
  const code = back.searchParams.get("code")!;

  const token = await api.json("/api/auth/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT,
      client_id: clientId,
      code_verifier: verifier,
      resource: RESOURCE,
    }).toString(),
  });
  expect(token.status, JSON.stringify(token.body)).toBe(200);
  return { clientId, ...token.body };
}
