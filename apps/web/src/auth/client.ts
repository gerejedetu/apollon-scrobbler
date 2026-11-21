/**
 * Better Auth from the browser: sign-up, sign-in, sign-out, API keys (the ListenBrainz user tokens) and the
 * OAuth consent of MCP clients.
 * Same origin as the page, so the session cookie is first-party (see src/edge/proxy.ts).
 */
import { apiKeyClient } from "@better-auth/api-key/client";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  // oauthProviderClient: on the OAuth sign-in and consent pages, sends the signed query back with each call.
  plugins: [usernameClient(), apiKeyClient(), oauthProviderClient()],
});
