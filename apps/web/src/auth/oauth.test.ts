import { describe, expect, test } from "vite-plus/test";
import { isOAuthRequest, oauthRedirect } from "./oauth.ts";

describe("OAuth pages", () => {
  test("recognise the signed query of an authorization", () => {
    expect(isOAuthRequest({ sig: "abc", client_id: "c1", scope: "openid" })).toBe(true);
    expect(isOAuthRequest({ redirect: "/u/alice" })).toBe(false);
  });

  test("follow only absolute redirects that Better Auth marks as such", () => {
    expect(
      oauthRedirect({ redirect: true, url: "https://claude.ai/api/mcp/auth_callback?code=x" }),
    ).toBe("https://claude.ai/api/mcp/auth_callback?code=x");
    expect(oauthRedirect({ redirect: true, url: "/autoriser?sig=x" })).toBe("/autoriser?sig=x");
    expect(oauthRedirect({ redirect: true, url: "//evil.test" })).toBeNull();
    expect(oauthRedirect({ redirect: false, url: "https://x.test" })).toBeNull();
    expect(oauthRedirect({ redirect: true, url: "javascript:alert(1)" })).toBeNull();
    expect(oauthRedirect({ token: "t", user: {} })).toBeNull();
    expect(oauthRedirect(null)).toBeNull();
  });
});
