/**
 * The OAuth flow an MCP client (claude.ai, Claude Desktop…) runs against this instance: discovery, dynamic
 * registration, sign-in and consent in the web front, code exchange with PKCE, then the access token works
 * on the native API like a user token.
 */
import { createHash, randomBytes } from "node:crypto";
import { beforeEach, describe, expect, test } from "vite-plus/test";
import { testApi, type TestApi } from "./helpers.ts";

const ORIGIN = "http://localhost";
const RESOURCE = `${ORIGIN}/mcp`;
const REDIRECT = "http://127.0.0.1:6274/callback";

let api: TestApi;
let cookie: string;

beforeEach(async () => {
  api = testApi();
  await api.signUp("Alice");
  cookie = api.cookies.Alice!;
});

const b64url = (b: Buffer) => b.toString("base64url");

async function register() {
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

function authorizeUrl(clientId: string, challenge: string) {
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

/** Runs the whole flow and returns the token response. */
async function obtainToken() {
  const clientId = await register();
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

describe("OAuth for MCP clients", () => {
  test("discovery documents at the root of the origin", async () => {
    const prm = await api.json("/.well-known/oauth-protected-resource/mcp");
    expect(prm.status).toBe(200);
    expect(prm.body).toMatchObject({ resource: RESOURCE, authorization_servers: [`${ORIGIN}/api/auth`] });

    const as = await api.json("/.well-known/oauth-authorization-server/api/auth");
    expect(as.status).toBe(200);
    expect(as.body).toMatchObject({
      issuer: `${ORIGIN}/api/auth`,
      authorization_endpoint: `${ORIGIN}/api/auth/oauth2/authorize`,
      token_endpoint: `${ORIGIN}/api/auth/oauth2/token`,
      registration_endpoint: `${ORIGIN}/api/auth/oauth2/register`,
    });
    expect(as.body.code_challenge_methods_supported).toContain("S256");
    expect((await api.json("/.well-known/unrelated")).status).toBe(404);
  });

  test("without a session, authorize sends the browser to the sign-in page", async () => {
    const clientId = await register();
    const res = await api.request(authorizeUrl(clientId, "x".repeat(43)));
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get("location")!, ORIGIN).pathname).toBe("/connexion");
  });

  test("the access token is a JWT for the MCP server that the API accepts as Alice", async () => {
    const token = await obtainToken();
    expect(token.access_token.split(".")).toHaveLength(3);
    expect(token.refresh_token).toBeTruthy();
    const me = await api.json("/v1/me", { headers: { authorization: `Bearer ${token.access_token}` } });
    expect(me.status).toBe(200);
    expect(me.body.userName).toBe("Alice");
  });

  test("a tampered token is refused, and API keys keep working", async () => {
    const token = await obtainToken();
    const [h, p, s] = token.access_token.split(".");
    const forged = `${h}.${p}.${s!.slice(0, -4)}AAAA`;
    expect((await api.json("/v1/me", { headers: { authorization: `Bearer ${forged}` } })).status).toBe(401);
    const key = await api.signUp("Bob");
    expect((await api.json("/v1/me", { headers: { authorization: `Token ${key}` } })).body.userName).toBe("Bob");
  });
});
