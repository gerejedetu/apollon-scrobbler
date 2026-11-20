import { beforeEach, describe, expect, test } from "vite-plus/test";
import { MemoryRateLimiter } from "../src/http/rate-limit.ts";
import { post, single, T0, testApi, type TestApi } from "./helpers.ts";

let api: TestApi;
let token: string;

beforeEach(async () => {
  api = testApi();
  token = await api.signUp("Alice");
});

describe("errors and basics", () => {
  test("root and unknown routes", async () => {
    expect((await api.json("/")).body).toMatchObject({ api: "/v1", listenbrainz: "/1" });
    expect(await api.json("/1/nope")).toEqual({
      status: 404,
      body: { code: 404, error: "Not found." },
    });
  });

  test("CORS is open on the ListenBrainz API", async () => {
    const res = await api.request("/1/validate-token", {
      method: "OPTIONS",
      headers: { origin: "https://any.test", "access-control-request-method": "GET" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  test("auth endpoints only allow trusted origins", async () => {
    const ok = await api.request("/api/auth/ok", { headers: { origin: "http://front.test" } });
    expect(ok.headers.get("access-control-allow-origin")).toBe("http://front.test");
    const no = await api.request("/api/auth/ok", { headers: { origin: "https://evil.test" } });
    expect(no.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("validate-token", () => {
  test("valid, invalid and missing tokens", async () => {
    expect(
      (await api.json("/1/validate-token", { headers: { authorization: `Token ${token}` } })).body,
    ).toEqual({
      code: 200,
      message: "Token valid.",
      valid: true,
      user_name: "Alice",
    });
    expect((await api.json(`/1/validate-token?token=${token}`)).body.valid).toBe(true);
    expect(
      (await api.json("/1/validate-token", { headers: { authorization: "Token nope" } })).body,
    ).toEqual({ code: 200, message: "Token invalid.", valid: false });
    expect((await api.json("/1/validate-token")).status).toBe(400);
  });
});

describe("submit-listens", () => {
  test("requires a valid token", async () => {
    expect((await api.json("/1/submit-listens", post(single(1)))).status).toBe(401);
    expect((await api.json("/1/submit-listens", post(single(1), "wrong"))).body).toEqual({
      code: 401,
      error: "Invalid authorization token.",
    });
  });

  test("rejects malformed JSON and invalid listens with ListenBrainz-style errors", async () => {
    expect(await api.json("/1/submit-listens", post("{oops", token))).toEqual({
      status: 400,
      body: { code: 400, error: "Invalid JSON document submitted." },
    });
    const bad = await api.json(
      "/1/submit-listens",
      post(
        {
          listen_type: "single",
          payload: [{ listened_at: T0, track_metadata: { track_name: "x" } }],
        },
        token,
      ),
    );
    expect(bad.status).toBe(400);
    expect(bad.body.error).toContain("artist_name");
  });

  test("single, import and playing_now round-trip through the read endpoints", async () => {
    expect(await api.json("/1/submit-listens", post(single(1), token))).toEqual({
      status: 200,
      body: { status: "ok" },
    });
    const imported = { listen_type: "import", payload: [2, 3, 4].map((i) => single(i).payload[0]) };
    expect((await api.json("/1/submit-listens", post(imported, token))).status).toBe(200);
    // Duplicates are ignored.
    await api.json("/1/submit-listens", post(single(1), token));

    const { body } = await api.json("/1/user/alice/listens?count=2");
    expect(body.payload).toMatchObject({
      count: 2,
      user_id: "Alice",
      latest_listen_ts: T0 + 4,
      oldest_listen_ts: T0 + 1,
    });
    expect(body.payload.listens[0]).toMatchObject({
      listened_at: T0 + 4,
      user_name: "Alice",
      recording_msid: expect.stringMatching(/^[0-9a-f-]{36}$/),
      track_metadata: {
        artist_name: "Daft Punk",
        track_name: "Track 4",
        release_name: "Discovery",
      },
    });
    expect(
      (await api.json(`/1/user/alice/listens?max_ts=${T0 + 3}`)).body.payload.listens.map(
        (l: any) => l.listened_at,
      ),
    ).toEqual([T0 + 2, T0 + 1]);
    expect((await api.json("/1/user/alice/listen-count")).body).toEqual({ payload: { count: 4 } });

    const now = {
      listen_type: "playing_now",
      payload: [{ track_metadata: { artist_name: "Air", track_name: "La femme d'argent" } }],
    };
    await api.json("/1/submit-listens", post(now, token));
    const playing = await api.json("/1/user/alice/playing-now");
    expect(playing.body.payload).toMatchObject({
      count: 1,
      playing_now: true,
      user_id: "Alice",
      listens: [{ playing_now: true, track_metadata: { artist_name: "Air" } }],
    });
    expect((await api.json("/1/user/alice/listen-count")).body.payload.count).toBe(4);
  });

  test("delete-listen", async () => {
    await api.json("/1/submit-listens", post(single(1), token));
    const [listen] = (await api.json("/1/user/alice/listens")).body.payload.listens;
    expect(
      (await api.json("/1/delete-listen", post({ listened_at: listen.listened_at }, token))).status,
    ).toBe(400);
    expect(
      (
        await api.json(
          "/1/delete-listen",
          post({ listened_at: listen.listened_at, recording_msid: listen.recording_msid }, token),
        )
      ).status,
    ).toBe(200);
    expect((await api.json("/1/user/alice/listen-count")).body.payload.count).toBe(0);
  });

  test("unknown users are 404", async () => {
    expect(await api.json("/1/user/bob/listens")).toEqual({
      status: 404,
      body: { code: 404, error: "Cannot find user: bob" },
    });
  });

  test("a 1000-listen import is one D1 round trip for the listens", async () => {
    const payload = Array.from({ length: 1000 }, (_, i) => single(i, `Artist ${i % 7}`).payload[0]);
    // Warm the token cache so only the insert is measured.
    await api.json("/1/validate-token", { headers: { authorization: `Token ${token}` } });
    api.db.roundTrips = 0;
    expect(
      (await api.json("/1/submit-listens", post({ listen_type: "import", payload }, token))).status,
    ).toBe(200);
    expect(api.db.roundTrips).toBe(1);
    expect((await api.json("/1/user/alice/listen-count")).body.payload.count).toBe(1000);
  });
});

describe("latest-import", () => {
  test("round-trips per service", async () => {
    expect((await api.json("/1/latest-import?user_name=alice")).body).toEqual({
      musicbrainz_id: "Alice",
      latest_import: 0,
    });
    expect((await api.json("/1/latest-import", post({ ts: T0 }))).status).toBe(401);
    expect((await api.json("/1/latest-import", post({ ts: T0 }, token))).status).toBe(200);
    expect(
      (await api.json("/1/latest-import?user_name=alice&service=lastfm")).body.latest_import,
    ).toBe(T0);
    expect((await api.json("/1/latest-import")).status).toBe(400);
  });
});

describe("stats", () => {
  test("204 without data, then top artists / recordings / releases", async () => {
    expect((await api.request("/1/stats/user/alice/artists")).status).toBe(204);
    const payload = [1, 2, 3].map((i) => single(i, i === 3 ? "Air" : "Daft Punk").payload[0]);
    await api.json("/1/submit-listens", post({ listen_type: "import", payload }, token));

    const artists = await api.json("/1/stats/user/alice/artists?range=all_time");
    expect(artists.body.payload).toMatchObject({
      user_id: "Alice",
      count: 2,
      total_artist_count: 2,
      offset: 0,
      range: "all_time",
      artists: [
        { artist_name: "Daft Punk", listen_count: 2 },
        { artist_name: "Air", listen_count: 1 },
      ],
    });
    expect(
      (await api.json("/1/stats/user/alice/recordings")).body.payload.total_recording_count,
    ).toBe(3);
    expect((await api.json("/1/stats/user/alice/releases")).body.payload.releases).toEqual([
      {
        artist_mbids: [],
        artist_name: "Daft Punk",
        listen_count: 2,
        release_mbid: null,
        release_name: "Discovery",
      },
      {
        artist_mbids: [],
        artist_name: "Air",
        listen_count: 1,
        release_mbid: null,
        release_name: "Discovery",
      },
    ]);
    expect((await api.json("/1/stats/user/alice/artists?range=decade")).status).toBe(400);
    // A 3-listen history is cheaper to recompute than to cache: no KV traffic at all.
    expect(api.kv.writes).toBe(0);
    expect(api.kv.reads).toBe(0);
  });
});

describe("accounts", () => {
  test("sign-up can be turned off", async () => {
    const closed = testApi({ DISABLE_SIGNUP: "true" });
    await expect(closed.signUp("bob")).rejects.toThrow(/sign-up failed/);
  });
});

describe("rate limits", () => {
  test("a client over its limit gets 429 with Retry-After; others are unaffected", async () => {
    const counts = new Map<string, number>();
    const limiter = (max: number) => ({
      limit: async ({ key }: { key: string }) => {
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return { success: counts.get(key)! <= max };
      },
    });
    const limited = testApi({ RATE_LIMIT_API: limiter(2), RATE_LIMIT_AUTH: limiter(100) });
    const ip = (n: string) => ({ headers: { "cf-connecting-ip": n } });
    expect((await limited.request("/v1/users/x/listens", ip("1.1.1.1"))).status).toBe(404);
    expect((await limited.request("/1/user/x/listens", ip("1.1.1.1"))).status).toBe(404);
    const blocked = await limited.request("/v1/users/x/listens", ip("1.1.1.1"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("60");
    expect(await blocked.json()).toMatchObject({ code: 429 });
    expect((await limited.request("/v1/users/x/listens", ip("2.2.2.2"))).status).toBe(404);
    // Keys never contain the raw token.
    await limited.request("/v1/me", { headers: { authorization: "Bearer secret-token" } });
    expect([...counts.keys()].some((k) => k.includes("secret-token"))).toBe(false);
  });

  test("sign-up is limited separately", async () => {
    const strict = testApi({ RATE_LIMIT_AUTH: { limit: async () => ({ success: false }) } });
    await expect(strict.signUp("bob")).rejects.toThrow(/429/);
  });
});

describe("in-isolate backstop", () => {
  test("MemoryRateLimiter: fixed window per key, bounded memory", async () => {
    let now = 0;
    const l = new MemoryRateLimiter(2, 60_000, () => now, 3);
    expect((await l.limit({ key: "a" })).success).toBe(true);
    expect((await l.limit({ key: "a" })).success).toBe(true);
    expect((await l.limit({ key: "a" })).success).toBe(false);
    expect((await l.limit({ key: "b" })).success).toBe(true);
    now = 60_000;
    expect((await l.limit({ key: "a" })).success).toBe(true);
    for (const k of ["c", "d", "e", "f"]) await l.limit({ key: k });
    expect((l as unknown as { windows: Map<string, unknown> }).windows.size).toBeLessThanOrEqual(3);
  });

  test("works without any Cloudflare binding: the 11th sign-up attempt in a minute is refused", async () => {
    const api = testApi();
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await api.request("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-connecting-ip": "9.9.9.9" },
        body: "{}",
      });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s !== 429)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
