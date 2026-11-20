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
        .replace("{artistName}", "Air");
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
    expect((await api.json("/v1/users/alice/artists/Nobody")).status).toBe(404);
  });
});
