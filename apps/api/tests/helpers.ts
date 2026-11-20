import { createMigratedD1 } from "@scrobbler/db-d1/testing";
import { MemoryKV, type SqliteD1 } from "@scrobbler/testing";
import { createApp } from "../src/app.ts";
import type { Bindings } from "../src/env.ts";

export interface TestApi {
  db: SqliteD1;
  kv: MemoryKV;
  request(path: string, init?: RequestInit): Promise<Response>;
  json<T = any>(path: string, init?: RequestInit): Promise<{ status: number; body: T }>;
  /** Signs up through Better Auth's real endpoints, then creates an API key with the session: returns the ListenBrainz token. */
  signUp(username: string): Promise<string>;
  /** Session cookie of each signed-up user, as a browser would send it. */
  cookies: Record<string, string>;
}

export function testApi(overrides: Partial<Bindings> = {}): TestApi {
  const db = createMigratedD1();
  const kv = new MemoryKV();
  const env: Bindings = {
    DB: db,
    CACHE: kv,
    BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0123",
    BASE_URL: "http://localhost",
    TRUSTED_ORIGINS: "http://front.test",
    ...overrides,
  };
  const app = createApp();
  const request = async (path: string, init?: RequestInit) => app.request(path, init, env);

  const api: TestApi = {
    db,
    kv,
    request,
    cookies: {},
    async json(path, init) {
      const res = await request(path, init);
      const text = await res.text();
      return { status: res.status, body: text ? JSON.parse(text) : null };
    },
    async signUp(username) {
      const res = await request("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: `${username.toLowerCase()}@example.test`,
          password: "correct horse battery",
          name: username,
          username,
        }),
      });
      if (res.status !== 200) throw new Error(`sign-up failed: ${res.status} ${await res.text()}`);
      const cookie = res.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
      api.cookies[username] = cookie;
      const key = await request("/api/auth/api-key/create", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ name: "test client" }),
      });
      if (key.status !== 200) throw new Error(`api-key failed: ${key.status} ${await key.text()}`);
      return ((await key.json()) as { key: string }).key;
    },
  };
  return api;
}

export const T0 = 1_700_000_000;

export function post(body: unknown, token?: string): RequestInit {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Token ${token}`;
  return { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) };
}

export function single(i: number, artist = "Daft Punk") {
  return {
    listen_type: "single",
    payload: [
      {
        listened_at: T0 + i,
        track_metadata: {
          artist_name: artist,
          track_name: `Track ${i}`,
          release_name: "Discovery",
        },
      },
    ],
  };
}
