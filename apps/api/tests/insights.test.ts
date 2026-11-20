/**
 * End-to-end tests of the extended stats: real SQL (node:sqlite with the D1 migrations) through the HTTP API.
 * The fixture is small and hand-checkable; times are UTC unless a test passes utcOffset.
 */
import { beforeAll, describe, expect, test } from "vite-plus/test";
import { openApiDocument } from "../src/protocols/native/openapi.ts";
import { testApi, type TestApi } from "./helpers.ts";

const at = (iso: string) => Date.parse(iso) / 1000;

let api: TestApi;
let token: string;

// Monday 2026-11-16 .. Thursday 2026-11-19 (UTC), plus old history.
const LISTENS = [
  // 2025-11-19: "on this day" a year ago.
  {
    listenedAt: at("2025-11-19T10:00:00Z"),
    artist: "Portishead",
    track: "Roads",
    album: "Dummy",
    durationMs: 300_000,
  },
  {
    listenedAt: at("2025-11-19T10:05:00Z"),
    artist: "Portishead",
    track: "Glory Box",
    album: "Dummy",
    durationMs: 300_000,
  },
  // 2026-03: an old favourite, then nothing.
  ...Array.from({ length: 12 }, (_, i) => ({
    listenedAt: at("2026-03-01T12:00:00Z") + i * 600,
    artist: "Massive Attack",
    track: `Teardrop`,
    album: "Mezzanine",
  })),
  // The previous week (Nov 9-15): Air twice.
  {
    listenedAt: at("2026-11-10T09:00:00Z"),
    artist: "Air",
    track: "Playground Love",
    album: "The Virgin Suicides",
  },
  {
    listenedAt: at("2026-11-11T09:00:00Z"),
    artist: "Air",
    track: "Playground Love",
    album: "The Virgin Suicides",
  },
  // This week: a session of Daft Punk on Monday evening with a 3x repeat, then Air.
  {
    listenedAt: at("2026-11-16T20:00:00Z"),
    artist: "Daft Punk",
    track: "Digital Love",
    album: "Discovery",
    durationMs: 240_000,
  },
  {
    listenedAt: at("2026-11-16T20:04:00Z"),
    artist: "Daft Punk",
    track: "Digital Love",
    album: "Discovery",
    durationMs: 240_000,
  },
  {
    listenedAt: at("2026-11-16T20:08:00Z"),
    artist: "Daft Punk",
    track: "Digital Love",
    album: "Discovery",
    durationMs: 240_000,
  },
  {
    listenedAt: at("2026-11-16T20:12:00Z"),
    artist: "Daft Punk",
    track: "One More Time",
    album: "Discovery",
    durationMs: 240_000,
  },
  {
    listenedAt: at("2026-11-17T08:00:00Z"),
    artist: "Air",
    track: "Playground Love",
    album: "The Virgin Suicides",
  },
  {
    listenedAt: at("2026-11-17T08:05:00Z"),
    artist: "Air",
    track: "Playground Love",
    album: "The Virgin Suicides",
  },
  {
    listenedAt: at("2026-11-17T08:10:00Z"),
    artist: "Air",
    track: "Playground Love",
    album: "The Virgin Suicides",
  },
  { listenedAt: at("2026-11-18T23:30:00Z"), artist: "Moby", track: "Porcelain", album: "Play" },
  {
    listenedAt: at("2026-11-19T07:00:00Z"),
    artist: "Air",
    track: "Kelly Watch the Stars",
    album: "Moon Safari",
  },
];
const NOW_LISTENS = LISTENS.length; // 25
const NOW = Date.parse("2026-11-20T12:00:00Z") / 1000;

const get = async (path: string) => {
  const res = await api.json(`/v1/users/alice${path}`);
  if (res.status !== 200) throw new Error(`${path}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
};

beforeAll(async () => {
  // Friday 2026-11-20 12:00 UTC.
  api = testApi({}, NOW);
  token = await api.signUp("alice");
  const res = await api.json("/v1/listens", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ listens: LISTENS }),
  });
  expect(res.body.inserted).toBe(NOW_LISTENS);
});

describe("when you listen (1-8)", () => {
  test("1-3 clock: hours, weekdays and the heatmap agree", async () => {
    const c = await get("/stats/clock?range=this_week");
    // This week = Mon 16 .. now (the test clock is real time, so use all_time-independent counts).
    const total = c.hours.reduce((n: number, h: { listenCount: number }) => n + h.listenCount, 0);
    expect(c.weekdays.reduce((n: number, d: { listenCount: number }) => n + d.listenCount, 0)).toBe(
      total,
    );
    expect(c.heatmap).toHaveLength(7);
    expect(c.heatmap[0]).toHaveLength(24);
    const all = await get("/stats/clock");
    expect(all.hours[20].listenCount).toBe(4); // the Daft Punk session
    // Mondays: the 4 listens of Nov 16 only (2026-03-01 is a Sunday, Nov 10 a Tuesday).
    expect(all.weekdays[0]).toEqual({ weekday: "monday", listenCount: 4 });
    expect(all.weekdays[6]).toEqual({ weekday: "sunday", listenCount: 12 });
    expect(all.heatmap[0][20]).toBe(4);
    // utcOffset moves Moby (23:30 UTC Wednesday) to Thursday 00:30.
    const paris = await get("/stats/clock?utcOffset=60");
    expect(paris.hours[0].listenCount).toBe(1);
    expect(paris.weekdays[3].listenCount).toBeGreaterThan(all.weekdays[3].listenCount);
  });

  test("4 activity per month / year", async () => {
    const months = await get("/stats/activity?granularity=month");
    expect(months.periods).toEqual([
      { period: "2025-11", listenCount: 2 },
      { period: "2026-03", listenCount: 12 },
      { period: "2026-11", listenCount: 11 },
    ]);
    expect((await get("/stats/activity?granularity=year")).periods).toEqual([
      { period: "2025", listenCount: 2 },
      { period: "2026", listenCount: 23 },
    ]);
    expect((await get("/stats/activity?granularity=week&range=all_time")).periods[0].period).toBe(
      "2025-11-17",
    );
    expect((await api.json("/v1/users/alice/stats/activity?granularity=hour")).status).toBe(400);
  });

  test("5 streaks", async () => {
    const s = await get("/stats/streaks");
    expect(s.longest).toEqual({ days: 4, from: "2026-11-16", to: "2026-11-19" });
    expect(s.activeDays).toBe(1 + 1 + 2 + 4);
  });

  test("6-8 summary: busiest day, listening time, averages", async () => {
    const s = await get("/stats/summary");
    expect(s).toMatchObject({ listenCount: 25, artistCount: 5, activeDays: 8 });
    expect(s.busiestDay).toEqual({ date: "2026-03-01", listenCount: 12 });
    expect(s.listeningTime).toEqual({ totalMs: 2 * 300_000 + 4 * 240_000, listensWithDuration: 6 });
    expect(s.averagePerActiveDay).toBe(3.1);
    expect(s.averagePerDay).toBeGreaterThan(0);
  });
});

describe("discoveries and trends (9-16)", () => {
  test("9-10 discoveries of the range", async () => {
    const d = await get("/stats/discoveries?range=this_month");
    expect(d.artists.total).toBe(3); // Air, Daft Punk, Moby (Portishead and Massive Attack are older)
    expect(d.artists.items.map((a: { artistName: string }) => a.artistName)).toEqual([
      "Air",
      "Daft Punk",
      "Moby",
    ]);
    expect(d.tracks.total).toBe(5);
  });

  test("12 forgotten favourites", async () => {
    const f = await get("/stats/forgotten?months=3&minListens=10");
    expect(f.items).toEqual([
      {
        artistName: "Massive Attack",
        trackName: null,
        releaseName: null,
        listenCount: 12,
        lastListenedAt: expect.any(Number),
      },
    ]);
  });

  test("13 on repeat and 14 trends", async () => {
    const r = await get("/stats/on-repeat");
    expect(r.items[0]).toMatchObject({
      artistName: "Daft Punk",
      trackName: "Digital Love",
      current: 3,
      previous: 0,
    });
    const t = await get("/stats/trends?range=this_week&entity=artists");
    expect(t.rising.map((x: { artistName: string }) => x.artistName)).toContain("Daft Punk");
    expect((await api.json("/v1/users/alice/stats/trends?range=all_time")).status).toBe(400);
  });

  test("15 compare with the previous period", async () => {
    const c = await get("/stats/compare?range=this_month");
    expect(c.current.listenCount).toBe(11);
    expect(c.changePercent).toHaveProperty("listenCount");
  });

  test("16 one-shots", async () => {
    const o = await get("/stats/one-shots");
    expect(o.total).toBe(5); // Roads, Glory Box, One More Time, Porcelain, Kelly Watch the Stars
  });
});

describe("pages and evolution (17-26)", () => {
  test("17 album page", async () => {
    const a = await get(`/albums/${encodeURIComponent("Daft Punk")}/Discovery`);
    expect(a).toMatchObject({ artist: "Daft Punk", album: "Discovery", listenCount: 4 });
    expect(
      a.tracks.map((t: { trackName: string; listenCount: number }) => [t.trackName, t.listenCount]),
    ).toEqual([
      ["Digital Love", 3],
      ["One More Time", 1],
    ]);
    expect((await api.json("/v1/users/alice/albums/Nobody/Nothing")).status).toBe(404);
  });

  test("18 track page (+11 first listen)", async () => {
    const t = await get(`/tracks/Air/${encodeURIComponent("Playground Love")}`);
    expect(t).toMatchObject({
      listenCount: 5,
      firstListenedAt: at("2026-11-10T09:00:00Z"),
      byMonth: [{ period: "2026-11", listenCount: 5 }],
    });
  });

  test("19 artist timeline", async () => {
    const t = await get(`/artists/${encodeURIComponent("Massive Attack")}/timeline`);
    expect(t.periods).toEqual([{ period: "2026-03", listenCount: 12 }]);
  });

  test("20 chart per month", async () => {
    const c = await get("/stats/chart?granularity=month&limit=2");
    const nov = c.periods.find((p: { period: string }) => p.period === "2026-11");
    expect(
      nov.items.map((i: { artistName: string; rank: number }) => [i.rank, i.artistName]),
    ).toEqual([
      [1, "Air"],
      [2, "Daft Punk"],
    ]);
  });

  test("21 diversity", async () => {
    const d = await get("/stats/diversity");
    expect(d).toMatchObject({
      listenCount: 25,
      artistCount: 5,
      topArtistListens: 12,
      top10ArtistListens: 25,
      topArtistShare: 48,
      top10ArtistShare: 100,
    });
  });

  test("22 sessions", async () => {
    const s = await get("/stats/sessions");
    // 2025-11-19, 2026-03-01, Nov 10, Nov 11, Nov 16 evening, Nov 17 morning, Nov 18 night, Nov 19 morning.
    expect(s.sessionCount).toBe(8);
    expect(s.longest).toMatchObject({ listenCount: 12 });
  });

  test("23 back-to-back repeats", async () => {
    const r = await get("/stats/repeats");
    expect(r.items[0]).toMatchObject({
      artistName: "Massive Attack",
      trackName: "Teardrop",
      longestRun: 12,
    });
    expect(
      r.items
        .slice(1)
        .map((i: { trackName: string; longestRun: number }) => [i.trackName, i.longestRun]),
    ).toEqual([
      // Equal runs: the most recent first.
      ["Playground Love", 3],
      ["Digital Love", 3],
    ]);
  });

  test("24 wrapped", async () => {
    const w = await get("/stats/wrapped?year=2026");
    expect(w).toMatchObject({
      year: 2026,
      listenCount: 23,
      longestStreakDays: 4,
      busiestDay: { date: "2026-03-01", listenCount: 12 },
      busiestMonth: { month: "2026-03", listenCount: 12 },
    });
    expect(w.topArtists[0]).toEqual({ artist: "Massive Attack", listenCount: 12 });
    expect(w.newArtists).toBe(4);
  });

  test("25 milestones", async () => {
    const m = await get("/stats/milestones");
    expect(m.items.map((i: { n: number; trackName: string }) => [i.n, i.trackName])).toEqual([
      [1, "Roads"],
      [10, "Teardrop"],
    ]);
    expect(m.next).toBe(100);
  });

  test("26 on this day", async () => {
    const o = await get("/stats/on-this-day?date=2026-11-19");
    expect(o.years).toEqual([
      {
        year: 2025,
        yearsAgo: 1,
        listenCount: 2,
        tracks: [
          {
            artistName: "Portishead",
            trackName: "Glory Box",
            releaseName: "Dummy",
            listenCount: 1,
          },
          { artistName: "Portishead", trackName: "Roads", releaseName: "Dummy", listenCount: 1 },
        ],
      },
    ]);
    expect((await api.json("/v1/users/alice/stats/on-this-day?date=19/11")).status).toBe(400);
  });

  test("insights respect private profiles", async () => {
    await api.json("/v1/me", {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: '{"private":true}',
    });
    expect((await api.json("/v1/users/alice/stats/wrapped")).status).toBe(404);
    expect(
      (
        await api.json("/v1/users/alice/stats/wrapped", {
          headers: { authorization: `Bearer ${token}` },
        })
      ).status,
    ).toBe(200);
    await api.json("/v1/me", {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: '{"private":false}',
    });
  });
});

describe("the spec documents every field", () => {
  type Schema = { properties?: Record<string, Schema>; items?: Schema; type?: unknown };
  /** Returns the paths of response fields missing from the schema (objects and arrays are checked recursively). */
  function undocumented(value: unknown, schema: Schema | undefined, path: string): string[] {
    if (!schema || value === null || typeof value !== "object") return [];
    if (Array.isArray(value))
      return value.length && schema.items ? undocumented(value[0], schema.items, `${path}[]`) : [];
    if (!schema.properties) return [];
    return Object.entries(value).flatMap(([k, v]) =>
      k in schema.properties!
        ? undocumented(v, schema.properties![k], `${path}.${k}`)
        : [`${path}.${k}`],
    );
  }

  test.each([
    ["/users/{userName}/stats/wrapped", "/stats/wrapped?year=2026"],
    ["/users/{userName}/stats/summary", "/stats/summary"],
    ["/users/{userName}/stats/streaks", "/stats/streaks"],
    ["/users/{userName}/stats/sessions", "/stats/sessions"],
    ["/users/{userName}/stats/discoveries", "/stats/discoveries"],
    ["/users/{userName}/stats/milestones", "/stats/milestones"],
    ["/users/{userName}/stats/on-this-day", "/stats/on-this-day?date=2026-11-19"],
    ["/users/{userName}/artists/{artistName}", "/artists/Air"],
    ["/users/{userName}/albums/{artistName}/{albumName}", "/albums/Air/Moon%20Safari"],
  ])("%s", async (specPath, url) => {
    const paths = openApiDocument.paths as unknown as Record<
      string,
      { get: { responses: { "200": { content: { "application/json": { schema: Schema } } } } } }
    >;
    const schema = paths[specPath]!.get.responses["200"].content["application/json"].schema;
    expect(undocumented(await get(url), schema, "")).toEqual([]);
  });
});
