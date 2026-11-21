/**
 * The OAuth flow an MCP client (claude.ai, Claude Desktop…) runs against this instance: discovery, dynamic
 * registration, sign-in and consent in the web front, code exchange with PKCE, then the access token works
 * on the native API like a user token.
 */
import { beforeEach, describe, expect, test } from "vite-plus/test";
import { authorizeUrl, obtainOAuthToken, registerOAuthClient } from "./oauth-flow.ts";
import { testApi, type TestApi } from "./helpers.ts";

const ORIGIN = "http://localhost";
const RESOURCE = `${ORIGIN}/mcp`;

let api: TestApi;
let cookie: string;

beforeEach(async () => {
  api = testApi();
  await api.signUp("Alice");
  cookie = api.cookies.Alice!;
});

describe("OAuth for MCP clients", () => {
  test("discovery documents at the root of the origin", async () => {
    const prm = await api.json("/.well-known/oauth-protected-resource/mcp");
    expect(prm.status).toBe(200);
    expect(prm.body).toMatchObject({
      resource: RESOURCE,
      authorization_servers: [`${ORIGIN}/api/auth`],
    });

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
    const clientId = await registerOAuthClient(api);
    const res = await api.request(authorizeUrl(clientId, "x".repeat(43)));
    expect(res.status).toBe(302);
    const signIn = new URL(res.headers.get("location")!, ORIGIN);
    expect(signIn.pathname).toBe("/connexion");

    // The sign-in page sends the signed query back; the answer continues the authorization.
    const resumed = await api.json("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.test",
        password: "correct horse battery",
        oauth_query: signIn.search.slice(1),
      }),
    });
    expect(resumed.status, JSON.stringify(resumed.body)).toBe(200);
    expect(resumed.body.redirect).toBe(true);
    expect(resumed.body.url).toMatch(/^\/autoriser\?/);
  });

  test("the access token is a JWT for the MCP server that the API accepts as Alice", async () => {
    const token = await obtainOAuthToken(api, cookie);
    expect(token.access_token.split(".")).toHaveLength(3);
    expect(token.refresh_token).toBeTruthy();
    const me = await api.json("/v1/me", {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    expect(me.status).toBe(200);
    expect(me.body.userName).toBe("Alice");
  });

  test("a tampered token is refused, and API keys keep working", async () => {
    const token = await obtainOAuthToken(api, cookie);
    const [h, p, s] = token.access_token.split(".");
    const forged = `${h}.${p}.${s!.slice(0, -4)}AAAA`;
    expect(
      (await api.json("/v1/me", { headers: { authorization: `Bearer ${forged}` } })).status,
    ).toBe(401);
    const key = await api.signUp("Bob");
    expect(
      (await api.json("/v1/me", { headers: { authorization: `Token ${key}` } })).body.userName,
    ).toBe("Bob");
  });
});
