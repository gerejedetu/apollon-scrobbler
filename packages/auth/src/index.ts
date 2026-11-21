/**
 * Identity for the scrobbler, built on Better Auth:
 * - accounts and sessions (email + password, with a unique username = the ListenBrainz `user_name`);
 * - user tokens via the API key plugin. A key is what ListenBrainz clients send as `Authorization: Token <key>`;
 * - an OAuth 2.1 authorization server for the MCP server (`mcp` plugin + JWT signing keys), so assistants such as
 *   claude.ai connect with a sign-in and a consent screen instead of a pasted token.
 *
 * Better Auth owns its tables (`user`, `session`, `account`, `verification`, `apikey`); the scrobbler profile
 * (`users` row with listen counts) is created by a hook right after an account is created.
 */
import { apiKey } from "@better-auth/api-key";
import { mcp, requireMcpAuth } from "@better-auth/mcp";
import { isValidUserName, type TokenVerifier } from "@scrobbler/core";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { jwt, username } from "better-auth/plugins";

export interface AuthConfig {
  /** Any database Better Auth accepts; on Workers, the D1 binding itself. */
  database: BetterAuthOptions["database"];
  secret: string;
  baseURL: string;
  /** Origins allowed to call the auth endpoints with cookies (the web front). */
  trustedOrigins?: string[];
  /** Turns off new sign-ups (an instance for a closed group). */
  disableSignUp?: boolean;
  /** Creates the scrobbler profile of a new account. Throwing aborts nothing already written, so it must not fail. */
  onAccountCreated: (account: { id: string; userName: string }) => Promise<void>;
  /** Asked before every account creation; false refuses it (sign-up closed on this instance). */
  canSignUp?: () => Promise<boolean>;
  /** Runs non-critical writes after the response (Workers: `ctx.waitUntil`). */
  waitUntil?: (promise: Promise<unknown>) => void;
}

/** Pages of the web front the OAuth flow sends the browser to (they pass the signed query back). */
export const OAUTH_PAGES = { login: "/connexion", consent: "/autoriser" } as const;

/** The MCP server's URL for an instance: tokens are audience-bound to it. Same origin as the web front. */
export const mcpResource = (baseURL: string) => new URL("/mcp", baseURL).href;

/** How long an MCP access token lives (seconds); the client refreshes it with its refresh token. */
const ACCESS_TOKEN_TTL = 60 * 60;

function userNameOf(user: Record<string, unknown>): string | null {
  const display = user.displayUsername;
  const name = user.username;
  if (typeof display === "string" && display) return display;
  return typeof name === "string" && name ? name : null;
}

export function createAuth(config: AuthConfig) {
  return betterAuth({
    database: config.database,
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: "/api/auth",
    // The JWT plugin only provides signing keys here: no session JWT endpoint or header.
    disabledPaths: ["/token"],
    trustedOrigins: config.trustedOrigins ?? [],
    emailAndPassword: { enabled: true, disableSignUp: config.disableSignUp ?? false },
    telemetry: { enabled: false },
    advanced: {
      ...(config.waitUntil ? { backgroundTasks: { handler: config.waitUntil } } : {}),
      // The schema is managed by our migrations (and tested): skip Better Auth's runtime check, which
      // reads sqlite_master on every new instance, i.e. on every request that touches auth.
      database: { validateSchema: false },
    },
    plugins: [
      username({
        minUsernameLength: 1,
        maxUsernameLength: 64,
        usernameValidator: isValidUserName,
        displayUsernameValidator: isValidUserName,
      }),
      apiKey({
        // Scrobbling clients are their own rate limit; counting every request would cost a write each time.
        rateLimit: { enabled: false },
        // The `updatedAt` touch on each verification happens after the response.
        deferUpdates: true,
        defaultKeyLength: 40,
        enableMetadata: false,
      }),
      jwt({ disableSettingJwtHeader: true }),
      mcp({
        loginPage: OAUTH_PAGES.login,
        consentPage: OAUTH_PAGES.consent,
        resource: mcpResource(config.baseURL),
        accessTokenExpiresIn: ACCESS_TOKEN_TTL,
        // MCP clients (claude.ai, Claude Desktop, Cursor…) register themselves: public clients with PKCE, each
        // still needing the account owner's sign-in and consent before it gets a token.
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultApplicationType: "infer",
      }),
    ],
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (config.canSignUp && !(await config.canSignUp()))
              throw new APIError("FORBIDDEN", {
                message: "Sign-up is closed on this instance.",
                code: "SIGNUP_CLOSED",
              });
            if (!userNameOf(user))
              throw new APIError("BAD_REQUEST", {
                message: "A username is required to create an account.",
              });
            return { data: user };
          },
          after: async (user) => {
            const userName = userNameOf(user);
            if (userName) await config.onAccountCreated({ id: user.id, userName });
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Core's `TokenVerifier` backed by the API key plugin: a valid, enabled, unexpired key gives its account id. */
export function apiKeyVerifier(auth: Auth): TokenVerifier {
  return {
    async verify(rawToken) {
      const result = await auth.api.verifyApiKey({ body: { key: rawToken } });
      return result.valid && result.key ? result.key.referenceId : null;
    },
  };
}

/**
 * OAuth access tokens issued to MCP clients (JWTs audience-bound to the MCP resource), checked in-process by
 * the plugin's own guard: signature against the instance's keys, issuer, audience, expiry. Gives the `sub`.
 */
export function oauthTokenVerifier(auth: Auth, resource: string): TokenVerifier {
  return {
    async verify(rawToken) {
      let subject: string | null = null;
      const guard = requireMcpAuth(
        auth,
        (_request, claims) => {
          subject = typeof claims.sub === "string" ? claims.sub : null;
          return new Response(null, { status: 204 });
        },
        { resource },
      );
      const response = await guard(
        new Request(resource, { method: "POST", headers: { authorization: `Bearer ${rawToken}` } }),
      );
      return response.status === 204 ? subject : null;
    },
  };
}

/** A JWT has three dot-separated parts; API keys have none. */
const isJwt = (token: string) => token.split(".").length === 3;

/** Both kinds of user tokens: API keys (scrobblers, scripts) and OAuth access tokens (MCP clients). */
export function tokenVerifier(auth: Auth, resource: string): TokenVerifier {
  const keys = apiKeyVerifier(auth);
  const oauth = oauthTokenVerifier(auth, resource);
  return { verify: (raw) => (isJwt(raw) ? oauth.verify(raw) : keys.verify(raw)) };
}
