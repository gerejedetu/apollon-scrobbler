import { MemoryCache, createServices } from "@scrobbler/core";
import { createD1Repositories } from "@scrobbler/db-d1";
import { createMigratedD1 } from "@scrobbler/db-d1/testing";
import { beforeEach, expect, test } from "vite-plus/test";
import { apiKeyVerifier, createAuth, type Auth } from "../src/index.ts";

let auth: Auth;
let services: ReturnType<typeof createServices>;

beforeEach(() => {
  // The node:sqlite double has prepare/batch/exec, so Better Auth drives it exactly like a D1 binding.
  const db = createMigratedD1();
  const repos = createD1Repositories(db);
  auth = createAuth({
    database: db as never,
    secret: "test-secret-test-secret-test-secret-0123",
    baseURL: "http://localhost",
    onAccountCreated: async ({ id, userName }) => {
      await services.users.createProfile(id, userName);
    },
  });
  services = createServices(repos, apiKeyVerifier(auth), { authCache: new MemoryCache() });
});

async function signUp(username: string) {
  return auth.api.signUpEmail({
    body: {
      email: `${username.toLowerCase()}@example.test`,
      password: "correct horse battery",
      name: username,
      username,
    },
  });
}

test("sign-up creates the scrobbler profile, keeping the username's case", async () => {
  await signUp("Alice");
  expect(await services.users.requireByName("alice")).toMatchObject({
    name: "Alice",
    listenCount: 0,
  });
});

test("sign-up without a username is refused", async () => {
  await expect(
    auth.api.signUpEmail({
      body: { email: "x@example.test", password: "correct horse battery", name: "x" },
    }),
  ).rejects.toThrow();
});

test("usernames follow the ListenBrainz user_name rules and are unique", async () => {
  await expect(signUp("bad name")).rejects.toThrow();
  await signUp("alice");
  await expect(
    auth.api.signUpEmail({
      body: {
        email: "other@example.test",
        password: "correct horse battery",
        name: "a",
        username: "ALICE",
      },
    }),
  ).rejects.toThrow();
});

test("an API key is a ListenBrainz token; disabling it revokes it", async () => {
  const { user } = await signUp("alice");
  const created = await auth.api.createApiKey({ body: { userId: user.id, name: "scrobbler" } });
  expect(created.key.length).toBeGreaterThanOrEqual(40);

  expect((await services.auth.requireUser(`Token ${created.key}`)).name).toBe("alice");
  await expect(services.auth.requireUser("Token not-a-key")).rejects.toThrow();

  // Server-side revocation (deleting needs the owner's session, which the web front will hold).
  await auth.api.updateApiKey({ body: { keyId: created.id, userId: user.id, enabled: false } });
  expect(await apiKeyVerifier(auth).verify(created.key)).toBeNull();
});
