import { beforeEach, describe, expect, test } from "vite-plus/test";
import { openApiDocument } from "../src/protocols/native/openapi.ts";
import { T0, testApi, type TestApi } from "./helpers.ts";

let api: TestApi;
let token: string;
const MBID = "8f3471b5-7e6a-48da-86a9-c1c07a0f47ae";

function send(
  method: string,
  body: unknown,
  auth: Record<string, string> = { authorization: `Bearer ${token}` },
) {
  return {
    method,
    headers: { "content-type": "application/json", ...auth },
    body: JSON.stringify(body),
  };
}

beforeEach(async () => {
  api = testApi();
  token = await api.signUp("Alice");
});

describe("native API", () => {
  test("/me works with a token or the session cookie, not without", async () => {
    expect(
      (await api.json("/v1/me", { headers: { authorization: `Bearer ${token}` } })).body,
    ).toMatchObject({ userName: "Alice", listenCount: 0 });
    expect(
      (await api.json("/v1/me", { headers: { cookie: api.cookies.Alice! } })).body.userName,
    ).toBe("Alice");
    expect((await api.json("/v1/me")).status).toBe(401);
  });

  test("submit listens (Unix or ISO dates), read them back paginated, and the ListenBrainz API sees them too", async () => {
    const body = {
      listens: [
        {
          listenedAt: T0,
          artist: "Air",
          track: "Playground Love",
          album: "The Virgin Suicides",
          durationMs: 210_000,
          mbids: { recording: MBID },
          extra: { player: "test" },
        },
        {
          listenedAt: new Date((T0 + 60) * 1000).toISOString(),
          artist: "Air",
          track: "Kelly Watch the Stars",
        },
        { listenedAt: T0 + 120, artist: "Daft Punk", track: "Digital Love" },
      ],
    };
    expect((await api.json("/v1/listens", send("POST", body))).body).toEqual({
      accepted: 3,
      inserted: 3,
    });
    expect((await api.json("/v1/listens", send("POST", body))).body).toEqual({
      accepted: 3,
      inserted: 0,
    });

    const page = await api.json("/v1/users/alice/listens?limit=2");
    expect(page.body).toMatchObject({
      userName: "Alice",
      count: 2,
      oldestListenedAt: T0,
      latestListenedAt: T0 + 120,
      next: T0 + 60,
    });
    const older = await api.json(`/v1/users/alice/listens?limit=2&before=${page.body.next}`);
    expect(older.body.next).toBeNull();
    expect(older.body.listens[0]).toEqual({
      id: expect.any(String),
      listenedAt: T0,
      insertedAt: expect.any(Number),
      artist: "Air",
      track: "Playground Love",
      album: "The Virgin Suicides",
      durationMs: 210_000,
      mbids: { recording: MBID, release: null, artists: [] },
      extra: { player: "test" },
    });

    expect((await api.json("/1/user/alice/listen-count")).body.payload.count).toBe(3);
  });

  test("validation errors are clear", async () => {
    expect((await api.json("/v1/listens", send("POST", { listens: [] }))).status).toBe(400);
    const missing = await api.json("/v1/listens", send("POST", { listens: [{ artist: "Air" }] }));
    expect(missing.body).toEqual({ code: 400, error: "listens[0].track is required." });
    expect(
      (
        await api.json(
          "/v1/listens",
          send("POST", { listens: [{ artist: "a", track: "b", listenedAt: "yesterday" }] }),
        )
      ).status,
    ).toBe(400);
    expect(
      (await api.json("/v1/listens", send("POST", { listens: [{ artist: "a", track: "b" }] }, {})))
        .status,
    ).toBe(401);
  });

  test("listenedAt defaults to now", async () => {
    const before = Math.floor(Date.now() / 1000);
    await api.json("/v1/listens", send("POST", { listens: [{ artist: "a", track: "b" }] }));
    const [listen] = (await api.json("/v1/users/alice/listens")).body.listens;
    expect(listen.listenedAt).toBeGreaterThanOrEqual(before);
  });

  test("now playing", async () => {
    expect((await api.json("/v1/users/alice/now-playing")).body).toEqual({
      userName: "Alice",
      nowPlaying: null,
    });
    expect(
      (
        await api.request(
          "/v1/now-playing",
          send("PUT", { artist: "Air", track: "Playground Love" }),
        )
      ).status,
    ).toBe(204);
    expect((await api.json("/v1/users/alice/now-playing")).body.nowPlaying).toMatchObject({
      artist: "Air",
      track: "Playground Love",
      album: null,
    });
  });

  test("delete a listen", async () => {
    await api.json(
      "/v1/listens",
      send("POST", { listens: [{ listenedAt: T0, artist: "a", track: "b" }] }),
    );
    const [listen] = (await api.json("/v1/users/alice/listens")).body.listens;
    expect(
      (
        await api.request(`/v1/listens/${listen.listenedAt}/${listen.id}`, {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` },
        })
      ).status,
    ).toBe(204);
    expect(
      (await api.json("/v1/me", { headers: { authorization: `Bearer ${token}` } })).body
        .listenCount,
    ).toBe(0);
  });

  test("loved tracks and obsession", async () => {
    const auth = { authorization: `Bearer ${token}` };
    expect((await api.json("/v1/users/alice/loved")).body).toEqual({
      userName: "Alice",
      total: 0,
      items: [],
    });
    const love = (body: unknown) => api.request("/v1/me/loved", send("PUT", body));
    expect(
      (
        await love({
          artist: "Air",
          track: "La femme d'argent",
          album: "Moon Safari",
          mbids: { release: MBID },
        })
      ).status,
    ).toBe(204);
    expect((await love({ artist: "Air", track: "" })).status).toBe(400);
    expect(
      (await api.request("/v1/me/loved", send("PUT", { artist: "Air", track: "x" }, {}))).status,
    ).toBe(401);
    const loved = (await api.json("/v1/users/alice/loved")).body;
    expect(loved.total).toBe(1);
    expect(loved.items[0]).toMatchObject({
      artist: "Air",
      track: "La femme d'argent",
      album: "Moon Safari",
      mbids: { recording: null, release: MBID },
    });
    expect(typeof loved.items[0].lovedAt).toBe("number");
    const q = new URLSearchParams({ artist: "Air", track: "La femme d'argent" });
    expect(
      (await api.request(`/v1/me/loved?${q}`, { method: "DELETE", headers: auth })).status,
    ).toBe(204);
    expect((await api.json("/v1/users/alice/loved")).body.total).toBe(0);

    expect((await api.json("/v1/users/alice/obsession")).body.obsession).toBeNull();
    expect(
      (
        await api.request(
          "/v1/me/obsession",
          send("PUT", { artist: "Air", track: "Kelly Watch the Stars" }),
        )
      ).status,
    ).toBe(204);
    expect((await api.json("/v1/users/alice/obsession")).body.obsession).toMatchObject({
      artist: "Air",
      track: "Kelly Watch the Stars",
    });
    expect(
      (await api.request("/v1/me/obsession", { method: "DELETE", headers: auth })).status,
    ).toBe(204);
    expect((await api.json("/v1/users/alice/obsession")).body.obsession).toBeNull();
  });

  test("stats return 200 with empty items, and 404 on unknown entities", async () => {
    expect((await api.json("/v1/users/alice/stats/artists")).body).toMatchObject({
      entity: "artists",
      range: "all_time",
      total: 0,
      items: [],
    });
    await api.json(
      "/v1/listens",
      send("POST", {
        listens: [0, 1, 2].map((i) => ({
          listenedAt: T0 + i,
          artist: i < 2 ? "Air" : "Moby",
          track: `t${i}`,
        })),
      }),
    );
    const top = await api.json("/v1/users/alice/stats/artists?limit=1");
    expect(top.body).toMatchObject({
      total: 2,
      offset: 0,
      items: [{ artist: "Air", listenCount: 2 }],
    });
    expect((await api.json("/v1/users/alice/stats/genres")).status).toBe(404);
    expect((await api.json("/v1/users/bob/stats/artists")).status).toBe(404);
  });

  test("the OpenAPI document is served and every documented path is routed", async () => {
    const doc = await api.json("/v1/openapi.json");
    expect(doc.body.openapi).toBe("3.1.0");
    for (const [path, ops] of Object.entries(openApiDocument.paths)) {
      const concrete = path
        .replace("{userName}", "alice")
        .replace("{entity}", "artists")
        .replace("{listenedAt}", String(T0))
        .replace("{id}", "x")
        .replace("{artistName}", "Air")
        .replace("{albumName}", "Moon")
        .replace("{trackName}", "x");
      for (const method of Object.keys(ops)) {
        const res = await api.request(`/v1${concrete}`, {
          method: method.toUpperCase(),
          headers: { "content-type": "application/json" },
          body: method === "get" ? undefined : "{}",
        });
        const body = res.status === 404 ? ((await res.json()) as { error: string }).error : "";
        expect(body, `${method} ${path}`).not.toBe("Not found.");
      }
    }
  });
});

describe("private profiles", () => {
  test("only the owner reads a private profile, on both APIs", async () => {
    const bobToken = await api.signUp("bob");
    await api.json(
      "/v1/listens",
      send("POST", { listens: [{ listenedAt: T0, artist: "Air", track: "x" }] }),
    );
    const patch = await api.json("/v1/me", send("PATCH", { private: true }));
    expect(patch.body).toMatchObject({ userName: "Alice", private: true });

    const paths = [
      "/v1/users/alice/listens",
      "/v1/users/alice/now-playing",
      "/v1/users/alice/stats/artists",
      "/v1/users/alice/stats/summary",
      "/v1/users/alice/stats/activity",
      "/v1/users/alice/artists/Air",
      "/1/user/alice/listens",
      "/1/user/alice/listen-count",
      "/1/user/alice/playing-now",
      "/1/stats/user/alice/artists",
      "/1/latest-import?user_name=alice",
    ];
    for (const path of paths) {
      expect((await api.json(path)).body, `anonymous ${path}`).toEqual({
        code: 404,
        error: "Cannot find user: alice",
      });
      expect(
        (await api.json(path, { headers: { authorization: `Token ${bobToken}` } })).status,
        `bob ${path}`,
      ).toBe(404);
      expect(
        (await api.json(path, { headers: { authorization: `Token ${token}` } })).status,
        `owner ${path}`,
      ).toBe(200);
    }
    // The owner's browser session works too.
    expect(
      (await api.json("/v1/users/alice/listens", { headers: { cookie: api.cookies.Alice! } }))
        .status,
    ).toBe(200);
    // A bad token is an error, not an anonymous read.
    expect(
      (await api.json("/v1/users/alice/listens", { headers: { authorization: "Token nope" } }))
        .status,
    ).toBe(401);

    expect((await api.json("/v1/me", send("PATCH", { private: "yes" }))).status).toBe(400);
    await api.json("/v1/me", send("PATCH", { private: false }));
    expect((await api.json("/v1/users/alice/listens")).status).toBe(200);
  });
});

describe("more stats", () => {
  test("activity, summary and the artist page", async () => {
    const DAY = 86_400;
    await api.json(
      "/v1/listens",
      send("POST", {
        listens: [
          {
            listenedAt: T0 - 2 * DAY,
            artist: "Air",
            track: "Playground Love",
            album: "The Virgin Suicides",
          },
          {
            listenedAt: T0 - 2 * DAY + 300,
            artist: "Air",
            track: "Playground Love",
            album: "The Virgin Suicides",
          },
          { listenedAt: T0, artist: "Air", track: "Kelly Watch the Stars", album: "Moon Safari" },
          { listenedAt: T0 + 60, artist: "Moby", track: "Porcelain" },
        ],
      }),
    );

    const activity = await api.json("/v1/users/alice/stats/activity");
    expect(activity.body.days.slice(0, 3)).toEqual([
      { date: "2023-11-12", listenCount: 2 },
      { date: "2023-11-13", listenCount: 0 },
      { date: "2023-11-14", listenCount: 2 },
    ]);
    expect(
      (await api.json("/v1/users/alice/stats/activity?utcOffset=120")).body.days.slice(0, 3),
    ).toEqual([
      { date: "2023-11-13", listenCount: 2 },
      { date: "2023-11-14", listenCount: 0 },
      { date: "2023-11-15", listenCount: 2 },
    ]);

    expect((await api.json("/v1/users/alice/stats/summary")).body).toMatchObject({
      range: "all_time",
      listenCount: 4,
      artistCount: 2,
      recordingCount: 3,
      releaseCount: 2,
      firstListenedAt: T0 - 2 * DAY,
      lastListenedAt: T0 + 60,
    });

    const air = await api.json(`/v1/users/alice/artists/${encodeURIComponent("Air")}?limit=1`);
    expect(air.body).toMatchObject({
      artist: "Air",
      listenCount: 3,
      trackCount: 2,
      topTracks: [{ track: "Playground Love", album: "The Virgin Suicides", listenCount: 2 }],
    });
    expect(air.body.topTracks).toHaveLength(1);
    expect(air.body.albumCount).toBe(2);
    expect(
      air.body.albums.map((a: { album: string; listenCount: number }) => [a.album, a.listenCount]),
    ).toEqual([["The Virgin Suicides", 2]]);
    expect((await api.json("/v1/users/alice/artists/Nobody")).status).toBe(404);
  });
});

describe("documentation", () => {
  test("every operation has an id, a tag and a description; every parameter and response is described", () => {
    const ids = new Set<string>();
    const tags = new Set(openApiDocument.tags.map((t) => t.name));
    const problems: string[] = [];
    for (const [path, ops] of Object.entries(
      openApiDocument.paths as Record<string, Record<string, any>>,
    )) {
      for (const [method, op] of Object.entries(ops)) {
        const where = `${method.toUpperCase()} ${path}`;
        if (!op.operationId || ids.has(op.operationId))
          problems.push(`${where}: missing or duplicate operationId`);
        ids.add(op.operationId);
        if (!op.tags?.length || !tags.has(op.tags[0])) problems.push(`${where}: unknown tag`);
        if (!op.summary || (op.description ?? "").length < 40)
          problems.push(`${where}: summary or description too short`);
        for (const p of op.parameters ?? [])
          if (!p.description) problems.push(`${where}: parameter ${p.name} undescribed`);
        for (const [code, r] of Object.entries(op.responses ?? {}))
          if (!(r as any).description) problems.push(`${where}: response ${code} undescribed`);
      }
    }
    expect(problems).toEqual([]);
    expect(openApiDocument.info.description).toContain("Getting started");
  });

  test("/v1/docs serves the interactive reference", async () => {
    const res = await api.request("/v1/docs");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('data-url="./openapi.json"');
  });
});

describe("instance sign-up", () => {
  const signUpRaw = (api: ReturnType<typeof testApi>, name: string) =>
    api.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: `${name}@example.test`,
        password: "correct horse battery",
        name,
        username: name,
      }),
    });

  test("open until the first account, then closed server-side; only the owner reopens it", async () => {
    const fresh = testApi();
    expect((await fresh.json("/v1/instance")).body).toEqual({ hasUsers: false, signupOpen: true });
    const ownerToken = await fresh.signUp("owner");
    expect((await fresh.json("/v1/instance")).body).toEqual({ hasUsers: true, signupOpen: false });

    // Closed in Better Auth itself, not just hidden: a direct sign-up is refused.
    const refused = await signUpRaw(fresh, "intruder");
    expect(refused.status).toBe(403);
    expect(await refused.text()).toContain("closed");

    expect(
      (await fresh.json("/v1/me", { headers: { authorization: `Bearer ${ownerToken}` } })).body
        .owner,
    ).toBe(true);
    const open = await fresh.json("/v1/instance", {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ signupOpen: true }),
    });
    expect(open.body.signupOpen).toBe(true);
    expect((await signUpRaw(fresh, "friend")).status).toBe(200);

    // A second account is not the owner and cannot change instance settings.
    const friendToken = await fresh.signUp("friend2");
    expect(
      (await fresh.json("/v1/me", { headers: { authorization: `Bearer ${friendToken}` } })).body
        .owner,
    ).toBe(false);
    const denied = await fresh.json("/v1/instance", {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${friendToken}` },
      body: JSON.stringify({ signupOpen: false }),
    });
    expect(denied.status).toBe(403);
    expect((await fresh.json("/v1/instance", { method: "PATCH", body: "{}" })).status).toBe(401);
    expect(
      (
        await fresh.json("/v1/instance", {
          method: "PATCH",
          headers: { "content-type": "application/json", authorization: `Bearer ${ownerToken}` },
          body: JSON.stringify({ signupOpen: "yes" }),
        })
      ).status,
    ).toBe(400);
  });

  test("DISABLE_SIGNUP keeps it closed even for the first account", async () => {
    const closed = testApi({ DISABLE_SIGNUP: "true" });
    expect((await closed.json("/v1/instance")).body.signupOpen).toBe(false);
  });
});

describe("library search", () => {
  test("finds artists, albums and tracks by part of their name; prefix first; private profiles stay hidden", async () => {
    await api.json(
      "/v1/listens",
      send("POST", {
        listens: [
          { listenedAt: T0, artist: "STAYC", track: "ASAP", album: "STAYDOM" },
          { listenedAt: T0 + 1, artist: "STAYC", track: "Teddy Bear", album: "Teddy Bear" },
          {
            listenedAt: T0 + 2,
            artist: "Mary J. Blige",
            track: "Stay Down",
            album: "Growing Pains",
          },
          { listenedAt: T0 + 3, artist: "Air", track: "100% Hits", album: "x" },
        ],
      }),
    );
    const r = await api.json("/v1/users/alice/search?q=stay");
    expect(r.body.artists).toEqual([{ artist: "STAYC", listenCount: 2 }]);
    expect(r.body.albums.map((a: { album: string }) => a.album)).toEqual(["STAYDOM"]);
    expect(r.body.tracks.map((t: { track: string }) => t.track)).toEqual(["Stay Down"]);
    // LIKE wildcards in the text are taken literally.
    expect(
      (await api.json("/v1/users/alice/search?q=%25")).body.tracks.map(
        (t: { track: string }) => t.track,
      ),
    ).toEqual(["100% Hits"]);
    expect((await api.json("/v1/users/alice/search")).status).toBe(400);
    expect((await api.json("/v1/users/alice/search?q=a&limit=999")).status).toBe(400);
    await api.json("/v1/me", send("PATCH", { private: true }));
    expect((await api.json("/v1/users/alice/search?q=stay")).status).toBe(404);
  });
});

describe("obsession history", () => {
  test("lists every obsession with its start and end", async () => {
    await api.request("/v1/me/obsession", send("PUT", { artist: "Air", track: "One" }));
    await api.request("/v1/me/obsession", send("PUT", { artist: "Air", track: "Two" }));
    const h = await api.json("/v1/users/alice/obsessions");
    expect(h.body.total).toBe(2);
    expect(h.body.items[0]).toMatchObject({ track: "Two", until: null });
    expect(h.body.items[1]).toMatchObject({ track: "One", until: expect.any(Number) });
  });
});

describe("profile accent and public card", () => {
  test("PATCH /me sets or resets the accent; the public card shows it", async () => {
    const set = await api.json("/v1/me", send("PATCH", { accent: "#7C3AED" }));
    expect(set.body.accent).toBe("#7c3aed");
    expect((await api.json("/v1/users/alice")).body).toMatchObject({
      userName: "Alice",
      accent: "#7c3aed",
    });
    expect((await api.json("/v1/me", send("PATCH", { accent: "violet" }))).status).toBe(400);
    expect((await api.json("/v1/me", send("PATCH", { accent: null }))).body.accent).toBeNull();
    await api.json("/v1/me", send("PATCH", { private: true }));
    expect((await api.json("/v1/users/alice")).status).toBe(404);
  });

  test("the obsession history names the longest one", async () => {
    await api.request("/v1/me/obsession", send("PUT", { artist: "Air", track: "One" }));
    const h = await api.json("/v1/users/alice/obsessions");
    expect(h.body.longest).toMatchObject({ track: "One", until: null });
  });
});
