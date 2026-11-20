/**
 * Better Auth from the browser: sign-up, sign-in, sign-out and API keys (the ListenBrainz user tokens).
 * Same origin as the page, so the session cookie is first-party (see src/edge/proxy.ts).
 */
import { apiKeyClient } from "@better-auth/api-key/client";
import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [usernameClient(), apiKeyClient()],
});
