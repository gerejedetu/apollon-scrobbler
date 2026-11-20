import type { NewListen } from "@scrobbler/types";
import type { SqliteD1 } from "@scrobbler/testing";
import { beforeEach, describe, expect, test } from "vite-plus/test";
import { createD1Repositories } from "../src/index.ts";
import { chunkBySize } from "../src/repositories/listens.ts";
import { createMigratedD1 } from "../src/testing.ts";

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
  userId = (await repos.users.create("Alice", T0))!.id;
  db.roundTrips = 0;
});

describe("users and tokens", () => {
  test("names are unique and looked up case-insensitively", async () => {
    expect(await repos.users.create("alice", T0)).toBeNull();
    expect(await repos.users.findByName("ALICE")).toMatchObject({ id: userId, name: "Alice", listenCount: 0 });
    expect(await repos.users.findByName("bob")).toBeNull();
  });

  test("token hashes resolve to their user and can be revoked", async () => {
    await repos.tokens.add(userId, "h1", T0);
    await repos.tokens.add(userId, "h2", T0);
    expect((await repos.tokens.findUserByTokenHash("h1"))?.name).toBe("Alice");
    await repos.tokens.revokeAll(userId);
    expect(await repos.tokens.findUserByTokenHash("h2")).toBeNull();
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
    await repos.listens.insertMany(userId, [listen(1, { artistMbids: [MBID], recordingMbid: MBID, additionalInfo: { tags: ["a"], n: 1 } })], T0);
    const page = await repos.listens.page({ userId, limit: 10 });
    expect(page.listens[0]).toMatchObject({ artistMbids: [MBID], recordingMbid: MBID, additionalInfo: { tags: ["a"], n: 1 }, releaseName: "Album 1", insertedAt: T0 });
    await repos.listens.insertMany(userId, [listen(2)], T0);
    expect((await repos.listens.page({ userId, maxTs: T0 + 2, limit: 1 })).listens[0]?.releaseName).toBe("Album 1");
  });

  test("page: newest first, max_ts / min_ts exclusive, bounds, one round trip", async () => {
    await repos.listens.insertMany(userId, Array.from({ length: 10 }, (_, i) => listen(i)), T0);
    db.roundTrips = 0;
    const latest = await repos.listens.page({ userId, limit: 3 });
    expect(db.roundTrips).toBe(1);
    expect(latest.listens.map((l) => l.listenedAt - T0)).toEqual([9, 8, 7]);
    expect([latest.oldestListenTs, latest.latestListenTs]).toEqual([T0, T0 + 9]);

    expect((await repos.listens.page({ userId, maxTs: T0 + 5, limit: 2 })).listens.map((l) => l.listenedAt - T0)).toEqual([4, 3]);
    expect((await repos.listens.page({ userId, minTs: T0 + 5, limit: 2 })).listens.map((l) => l.listenedAt - T0)).toEqual([7, 6]);
    expect((await repos.listens.page({ userId, minTs: T0 + 2, maxTs: T0 + 6, limit: 10 })).listens.map((l) => l.listenedAt - T0)).toEqual([5, 4, 3]);

    const other = (await repos.users.create("bob", T0))!.id;
    expect(await repos.listens.page({ userId: other, limit: 5 })).toEqual({ listens: [], oldestListenTs: null, latestListenTs: null });
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
    const big = Array.from({ length: 200 }, (_, i) => listen(i, { additionalInfo: { blob: "y".repeat(9000) } }));
    expect(await repos.listens.insertMany(userId, big, T0)).toBe(200);
    expect(db.statements).toBeGreaterThan(2);
    expect((await repos.users.findByName("alice"))?.listenCount).toBe(200);
  });
});

describe("playing now and imports", () => {
  test("playing now upserts and expires", async () => {
    await repos.playingNow.set({ userId, trackMetadata: { artist_name: "A", track_name: "1" }, expiresAt: T0 + 10 });
    await repos.playingNow.set({ userId, trackMetadata: { artist_name: "A", track_name: "2" }, expiresAt: T0 + 10 });
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
    await repos.listens.insertMany(userId, Array.from({ length: 10 }, (_, i) => listen(i, { artistMbids: i % 3 === 0 ? [MBID] : [] })), T0);
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
    const top = await repos.stats.top({ userId, entity: "artists", window: { fromTs: T0 + 3, toTs: T0 + 4 }, limit: 10, offset: 0 });
    expect(top.rows.map((r) => [r.artistName, r.listenCount])).toEqual([
      ["Artist 0", 1],
      ["Artist 1", 1],
    ]);
  });

  test("top recordings and releases", async () => {
    const rec = await repos.stats.top({ userId, entity: "recordings", window, limit: 100, offset: 0 });
    expect(rec.total).toBe(10);
    expect(rec.rows[0]).toMatchObject({ listenCount: 1, trackName: expect.any(String) });
    const rel = await repos.stats.top({ userId, entity: "releases", window, limit: 100, offset: 0 });
    // Only odd listens have a release: Album 1 (1,7 by Artist 1), Album 0 (3,9 by Artist 0), Album 2 (5 by Artist 2)
    expect(rel.total).toBe(3);
    expect(rel.rows.map((r) => [r.releaseName, r.listenCount])).toEqual([
      ["Album 0", 2],
      ["Album 1", 2],
      ["Album 2", 1],
    ]);
  });
});
