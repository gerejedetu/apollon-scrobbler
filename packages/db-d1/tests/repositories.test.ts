import type { NewListen } from "@scrobbler/types";
import type { SqliteD1 } from "@scrobbler/testing";
import { beforeEach, describe, expect, test } from "vite-plus/test";
import { createD1Repositories } from "../src/index.ts";
import { chunkBySize } from "../src/repositories/listens.ts";
import { createMigratedD1, insertAuthUser } from "../src/testing.ts";

const T0 = 1_700_000_000;
const MBID = "8f3471b5-7e6a-48da-86a9-c1c07a0f47ae";

function listen(i: number, over: Partial<NewListen> = {}): NewListen {
  return {
    listenedAt: T0 + i,
    recordingMsid: `msid-${i}`,
    artistName: `Artist ${i % 3}`,
    trackName: `Track ${i}`,
    releaseName: i % 2 ? `Album ${i % 3}` : null,
    recordingMbid: null,
    releaseMbid: null,
    artistMbids: [],
    additionalInfo: {},
    ...over,
  };
}

let db: SqliteD1;
let repos: ReturnType<typeof createD1Repositories>;
let userId: number;

beforeEach(async () => {
  db = createMigratedD1();
  repos = createD1Repositories(db);
  for (const id of ["a1", "a2", "a3"]) insertAuthUser(db, id);
  userId = (await repos.users.create("a1", "Alice", T0))!.id;
  db.roundTrips = 0;
});

describe("users", () => {
  test("names and accounts are unique; names are looked up case-insensitively", async () => {
    expect(await repos.users.create("a2", "alice", T0)).toBeNull();
    expect(await repos.users.create("a1", "other", T0)).toBeNull();
    expect(await repos.users.findByName("ALICE")).toMatchObject({
      id: userId,
      name: "Alice",
      listenCount: 0,
    });
    expect(await repos.users.findByAuthId("a1")).toMatchObject({ id: userId });
    expect(await repos.users.findByName("bob")).toBeNull();
  });

  test("deleting the Better Auth account deletes the profile and its listens", async () => {
    await repos.listens.insertMany(userId, [listen(1)], T0);
    db.raw.exec(`DELETE FROM "user" WHERE id = 'a1'`);
    expect(await repos.users.findByName("alice")).toBeNull();
    expect(db.raw.prepare("SELECT count(*) AS n FROM listens").get()).toEqual({ n: 0 });
  });
});

describe("listens", () => {
  test("insertMany stores everything in one round trip, ignores duplicates and keeps the count", async () => {
    const rows = Array.from({ length: 1000 }, (_, i) => listen(i));
    expect(await repos.listens.insertMany(userId, rows, T0 + 5000)).toBe(1000);
    expect(db.roundTrips).toBe(1);
    expect(await repos.listens.insertMany(userId, rows.slice(0, 10), T0 + 6000)).toBe(0);
    expect((await repos.users.findByName("alice"))?.listenCount).toBe(1000);
  });

  test("round-trips JSON columns and nulls", async () => {
    await repos.listens.insertMany(
      userId,
      [
        listen(1, {
          artistMbids: [MBID],
          recordingMbid: MBID,
          additionalInfo: { tags: ["a"], n: 1 },
        }),
      ],
      T0,
    );
    const page = await repos.listens.page({ userId, limit: 10 });
    expect(page.listens[0]).toMatchObject({
      artistMbids: [MBID],
      recordingMbid: MBID,
      additionalInfo: { tags: ["a"], n: 1 },
      releaseName: "Album 1",
      insertedAt: T0,
    });
    await repos.listens.insertMany(userId, [listen(2)], T0);
    expect(
      (await repos.listens.page({ userId, maxTs: T0 + 2, limit: 1 })).listens[0]?.releaseName,
    ).toBe("Album 1");
  });

  test("page: newest first, max_ts / min_ts exclusive, bounds, one round trip", async () => {
    await repos.listens.insertMany(
      userId,
      Array.from({ length: 10 }, (_, i) => listen(i)),
      T0,
    );
    db.roundTrips = 0;
    const latest = await repos.listens.page({ userId, limit: 3 });
    expect(db.roundTrips).toBe(1);
    expect(latest.listens.map((l) => l.listenedAt - T0)).toEqual([9, 8, 7]);
    expect([latest.oldestListenTs, latest.latestListenTs]).toEqual([T0, T0 + 9]);

    expect(
      (await repos.listens.page({ userId, maxTs: T0 + 5, limit: 2 })).listens.map(
        (l) => l.listenedAt - T0,
      ),
    ).toEqual([4, 3]);
    expect(
      (await repos.listens.page({ userId, minTs: T0 + 5, limit: 2 })).listens.map(
        (l) => l.listenedAt - T0,
      ),
    ).toEqual([7, 6]);
    expect(
      (await repos.listens.page({ userId, minTs: T0 + 2, maxTs: T0 + 6, limit: 10 })).listens.map(
        (l) => l.listenedAt - T0,
      ),
    ).toEqual([5, 4, 3]);

    const other = (await repos.users.create("a2", "bob", T0))!.id;
    expect(await repos.listens.page({ userId: other, limit: 5 })).toEqual({
      listens: [],
      oldestListenTs: null,
      latestListenTs: null,
    });
  });

  test("delete removes the listen and decrements the count", async () => {
    await repos.listens.insertMany(userId, [listen(1), listen(2)], T0);
    expect(await repos.listens.delete(userId, T0 + 1, "wrong")).toBe(false);
    expect(await repos.listens.delete(userId, T0 + 1, "msid-1")).toBe(true);
    expect((await repos.users.findByName("alice"))?.listenCount).toBe(1);
  });

  test("chunkBySize splits large payloads", () => {
    const tuples = Array.from({ length: 10 }, (_, i) => [i, "x".repeat(100)]);
    const chunks = chunkBySize(tuples, 300);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.flatMap((c) => JSON.parse(c) as unknown[])).toEqual(tuples);
  });

  test("insertMany splits into several statements when the JSON is big", async () => {
    const big = Array.from({ length: 200 }, (_, i) =>
      listen(i, { additionalInfo: { blob: "y".repeat(9000) } }),
    );
    expect(await repos.listens.insertMany(userId, big, T0)).toBe(200);
    expect(db.statements).toBeGreaterThan(2);
    expect((await repos.users.findByName("alice"))?.listenCount).toBe(200);
  });
});

describe("playing now and imports", () => {
  test("playing now upserts and expires", async () => {
    await repos.playingNow.set({
      userId,
      trackMetadata: { artist_name: "A", track_name: "1" },
      expiresAt: T0 + 10,
    });
    await repos.playingNow.set({
      userId,
      trackMetadata: { artist_name: "A", track_name: "2" },
      expiresAt: T0 + 10,
    });
    expect((await repos.playingNow.get(userId, T0))?.trackMetadata.track_name).toBe("2");
    expect(await repos.playingNow.get(userId, T0 + 10)).toBeNull();
  });

  test("latest import per service", async () => {
    expect(await repos.imports.getLatest(userId, "lastfm")).toBe(0);
    await repos.imports.setLatest(userId, "lastfm", 5);
    await repos.imports.setLatest(userId, "lastfm", 7);
    expect(await repos.imports.getLatest(userId, "lastfm")).toBe(7);
  });
});

describe("stats", () => {
  beforeEach(async () => {
    // Artist 0: listens 0,3,6,9 ; Artist 1: 1,4,7 ; Artist 2: 2,5,8
    await repos.listens.insertMany(
      userId,
      Array.from({ length: 10 }, (_, i) => listen(i, { artistMbids: i % 3 === 0 ? [MBID] : [] })),
      T0,
    );
  });

  const window = { fromTs: T0, toTs: T0 + 100 };

  test("top artists with totals and pagination", async () => {
    const top = await repos.stats.top({ userId, entity: "artists", window, limit: 2, offset: 0 });
    expect(top.total).toBe(3);
    expect(top.rows.map((r) => [r.artistName, r.listenCount])).toEqual([
      ["Artist 0", 4],
      ["Artist 1", 3],
    ]);
    expect(top.rows[0]?.artistMbids).toEqual([MBID]);
    const next = await repos.stats.top({ userId, entity: "artists", window, limit: 2, offset: 2 });
    expect(next.rows.map((r) => r.artistName)).toEqual(["Artist 2"]);
  });

  test("window bounds are inclusive", async () => {
    const top = await repos.stats.top({
      userId,
      entity: "artists",
      window: { fromTs: T0 + 3, toTs: T0 + 4 },
      limit: 10,
      offset: 0,
    });
    expect(top.rows.map((r) => [r.artistName, r.listenCount])).toEqual([
      ["Artist 0", 1],
      ["Artist 1", 1],
    ]);
  });

  test("top recordings and releases", async () => {
    const rec = await repos.stats.top({
      userId,
      entity: "recordings",
      window,
      limit: 100,
      offset: 0,
    });
    expect(rec.total).toBe(10);
    expect(rec.rows[0]).toMatchObject({ listenCount: 1, trackName: expect.any(String) });
    const rel = await repos.stats.top({
      userId,
      entity: "releases",
      window,
      limit: 100,
      offset: 0,
    });
    // Only odd listens have a release: Album 1 (1,7 by Artist 1), Album 0 (3,9 by Artist 0), Album 2 (5 by Artist 2)
    expect(rel.total).toBe(3);
    expect(rel.rows.map((r) => [r.releaseName, r.listenCount])).toEqual([
      ["Album 0", 2],
      ["Album 1", 2],
      ["Album 2", 1],
    ]);
  });
});

describe("private flag", () => {
  test("setPrivate toggles and is returned with the user", async () => {
    expect((await repos.users.findByName("alice"))?.isPrivate).toBe(false);
    expect((await repos.users.setPrivate(userId, true))?.isPrivate).toBe(true);
    expect((await repos.users.findByAuthId("a1"))?.isPrivate).toBe(true);
    expect(await repos.users.setPrivate(9999, true)).toBeNull();
  });
});

describe("activity, summary, artist", () => {
  const DAY = 86_400;
  beforeEach(async () => {
    const at = [0, 60, DAY, DAY + 3600];
    await repos.listens.insertMany(
      userId,
      at.map((t, i) =>
        listen(i, {
          listenedAt: T0 + t,
          artistName: i < 3 ? "Air" : "Moby",
          trackName: `T${i % 2}`,
          releaseName: i === 0 ? null : "R",
        }),
      ),
      T0,
    );
  });
  const window = { fromTs: 0, toTs: T0 + 10 * DAY };

  test("activity groups by shifted day", async () => {
    const days = await repos.stats.activity({ userId, window, utcOffsetSeconds: 0 });
    const d0 = Math.floor(T0 / DAY);
    expect(days).toEqual([
      { day: d0, listenCount: 2 },
      { day: d0 + 1, listenCount: 2 },
    ]);
    // T0 is 22:13 UTC: +2 h pushes every listen to the next local day.
    const shifted = await repos.stats.activity({ userId, window, utcOffsetSeconds: 7200 });
    expect(shifted).toEqual([
      { day: d0 + 1, listenCount: 2 },
      { day: d0 + 2, listenCount: 2 },
    ]);
  });

  test("summary in one statement", async () => {
    db.roundTrips = 0;
    expect(await repos.stats.summary(userId, window)).toEqual({
      listenCount: 4,
      artistCount: 2,
      recordingCount: 3,
      releaseCount: 2,
      firstListenedAt: T0,
      lastListenedAt: T0 + DAY + 3600,
    });
    expect(db.roundTrips).toBe(1);
    expect((await repos.stats.summary(userId, { fromTs: 0, toTs: 1 })).listenCount).toBe(0);
  });

  test("artist detail with top tracks, one round trip, and the artist index is used", async () => {
    db.roundTrips = 0;
    const air = await repos.stats.artist({ userId, artistName: "Air", window, limit: 10 });
    expect(db.roundTrips).toBe(1);
    expect(air).toMatchObject({
      artistName: "Air",
      listenCount: 3,
      trackCount: 2,
      firstListenedAt: T0,
      lastListenedAt: T0 + DAY,
      topTracks: [
        { trackName: "T0", listenCount: 2, releaseName: "R" },
        { trackName: "T1", listenCount: 1 },
      ],
    });
    expect(
      await repos.stats.artist({ userId, artistName: "Nobody", window, limit: 10 }),
    ).toBeNull();
    const plan = db.raw
      .prepare(
        "EXPLAIN QUERY PLAN SELECT count(*) FROM listens WHERE user_id = 1 AND artist_name = 'Air' AND listened_at BETWEEN 0 AND 1",
      )
      .all() as { detail: string }[];
    expect(plan.map((p) => p.detail).join(" ")).toContain("listens_user_artist_time");
  });
});

describe("joint credits", () => {
  const JOINT = "Peso Pluma & Estevan Plazola";
  const all = { fromTs: 0, toTs: T0 + 100 };

  beforeEach(async () => {
    await repos.listens.insertMany(
      userId,
      [
        listen(1, { artistName: JOINT, trackName: "Duo", releaseName: "Split" }),
        listen(2, { artistName: "Peso Pluma", trackName: "Solo", releaseName: "Solo LP" }),
        listen(3, { artistName: "Simon & Garfunkel", trackName: "Boxer" }),
      ],
      T0,
    );
  });

  test("a joint listen counts for each artist; bands stay whole", async () => {
    const { rows, total } = await repos.stats.top({
      userId,
      entity: "artists",
      window: all,
      limit: 10,
      offset: 0,
    });
    expect(Object.fromEntries(rows.map((r) => [r.artistName, r.listenCount]))).toEqual({
      "Peso Pluma": 2,
      "Estevan Plazola": 1,
      "Simon & Garfunkel": 1,
    });
    expect(total).toBe(3);
    const summary = await repos.stats.summary(userId, all);
    expect(summary.listenCount).toBe(3);
    expect(summary.artistCount).toBe(3);
  });

  test("tracks and albums keep the credit as written", async () => {
    const { rows } = await repos.stats.top({
      userId,
      entity: "recordings",
      window: all,
      limit: 10,
      offset: 0,
    });
    expect(rows.map((r) => r.artistName).sort()).toEqual(
      [JOINT, "Peso Pluma", "Simon & Garfunkel"].sort(),
    );
  });

  test("an artist page includes joint credits", async () => {
    const page = await repos.stats.artist({
      userId,
      artistName: "Peso Pluma",
      window: all,
      limit: 10,
    });
    expect(page?.listenCount).toBe(2);
    expect(page?.topTracks.map((t) => t.trackName).sort()).toEqual(["Duo", "Solo"]);
    const partner = await repos.stats.artist({
      userId,
      artistName: "Estevan Plazola",
      window: all,
      limit: 10,
    });
    expect(partner?.listenCount).toBe(1);
  });

  test("diversity counts listens once and artists per name", async () => {
    const d = await repos.insights.diversity({ userId, window: all, utcOffsetSeconds: 0 });
    expect(d.listenCount).toBe(3);
    expect(d.artistCount).toBe(3);
    expect(d.topArtistListens).toBe(2);
  });

  test("re-importing the same credit adds nothing twice", async () => {
    const inserted = await repos.listens.insertMany(
      userId,
      [listen(1, { artistName: JOINT, trackName: "Duo" })],
      T0,
    );
    expect(inserted).toBe(0);
    const { rows } = await repos.stats.top({
      userId,
      entity: "artists",
      window: all,
      limit: 10,
      offset: 0,
    });
    expect(rows.find((r) => r.artistName === "Estevan Plazola")?.listenCount).toBe(1);
  });
});

describe("favourites", () => {
  const t = (track: string, at: number) => ({
    artistName: "Air",
    trackName: track,
    releaseName: null,
    recordingMbid: null,
    releaseMbid: null,
    at,
  });

  test("loved tracks: upsert keeps the first date, newest first, unlove", async () => {
    await repos.favourites.love(userId, t("One", 10));
    await repos.favourites.love(userId, { ...t("Two", 20), releaseName: "Moon Safari" });
    await repos.favourites.love(userId, t("One", 30));
    db.roundTrips = 0;
    const page = await repos.favourites.loved(userId, 10, 0);
    expect(db.roundTrips).toBe(1);
    expect(page.total).toBe(2);
    expect(page.items.map((i) => [i.trackName, i.at])).toEqual([
      ["Two", 20],
      ["One", 10],
    ]);
    await repos.favourites.unlove(userId, "Air", "Two");
    expect((await repos.favourites.loved(userId, 10, 0)).total).toBe(1);
  });

  test("obsession: set, replace, clear", async () => {
    expect(await repos.favourites.obsession(userId)).toBeNull();
    await repos.favourites.setObsession(userId, t("One", 1));
    await repos.favourites.setObsession(userId, t("Two", 2));
    expect((await repos.favourites.obsession(userId))?.trackName).toBe("Two");
    await repos.favourites.setObsession(userId, null);
    expect(await repos.favourites.obsession(userId)).toBeNull();
  });
});

test("data_version moves with every real change to a user's listens", async () => {
  const v = async () => (await repos.users.findByName("alice"))!.dataVersion;
  const start = await v();
  await repos.listens.insertMany(userId, [listen(1), listen(2)], T0);
  const afterInsert = await v();
  expect(afterInsert).toBeGreaterThan(start);
  await repos.listens.insertMany(userId, [listen(1)], T0); // duplicate: nothing changes
  expect(await v()).toBe(afterInsert);
  await repos.listens.delete(userId, T0 + 1, "msid-1");
  expect(await v()).toBeGreaterThan(afterInsert);
});
