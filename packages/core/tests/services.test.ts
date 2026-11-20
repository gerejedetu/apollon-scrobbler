import { beforeEach, describe, expect, test } from "vite-plus/test";
import { ApiError, MemoryCache, createServices, tokenFromHeader, type Services } from "../src/index.ts";
import { fakeRepositories } from "./fakes.ts";

const T0 = 1_700_000_000;
let now = T0;
let repos: ReturnType<typeof fakeRepositories>;
let s: Services;

const track = (n: number) => ({ artist_name: `Artist ${n % 2}`, track_name: `Track ${n}` });

beforeEach(() => {
  now = T0;
  repos = fakeRepositories();
  s = createServices(repos, { clock: () => now, cache: new MemoryCache(), authCache: new MemoryCache() });
});

async function rejects(p: Promise<unknown>, code: number) {
  await expect(p).rejects.toSatisfy((e) => e instanceof ApiError && e.code === code);
}

describe("auth", () => {
  test("tokenFromHeader accepts Token and Bearer", () => {
    expect(tokenFromHeader("Token abc")).toBe("abc");
    expect(tokenFromHeader("bearer abc")).toBe("abc");
    expect(tokenFromHeader("Basic abc")).toBeNull();
    expect(tokenFromHeader(undefined)).toBeNull();
  });

  test("createUser issues a working token; names are unique and validated", async () => {
    const { user, token } = await s.auth.createUser("alice");
    expect(await s.auth.requireUser(`Token ${token}`)).toMatchObject({ id: user.id, name: "alice" });
    await rejects(s.auth.createUser("ALICE"), 409);
    await rejects(s.auth.createUser("bad name!"), 400);
    await rejects(s.auth.requireUser(undefined), 401);
    await rejects(s.auth.requireUser("Token nope"), 401);
  });

  test("resetToken revokes old tokens", async () => {
    const { token } = await s.auth.createUser("alice");
    s = createServices(repos, { clock: () => now }); // no auth cache, so revocation is immediate
    const fresh = await s.auth.resetToken("alice");
    await rejects(s.auth.requireUser(`Token ${token}`), 401);
    expect((await s.auth.requireUser(`Token ${fresh.token}`)).name).toBe("alice");
    await rejects(s.auth.resetToken("bob"), 404);
  });
});

describe("listens", () => {
  test("submit stores listens, dedupes, and lists newest first", async () => {
    const { user } = await s.auth.createUser("alice");
    const payload = [0, 1, 2].map((i) => ({ listened_at: T0 - 100 + i, track_metadata: track(i) }));
    expect(await s.listens.submit(user, { listen_type: "import", payload })).toEqual({ accepted: 3, inserted: 3 });
    expect(await s.listens.submit(user, { listen_type: "import", payload })).toEqual({ accepted: 3, inserted: 0 });

    const page = await s.listens.list(user, { count: "2" });
    expect(page.count).toBe(2);
    expect(page.listens.map((l) => l.listened_at)).toEqual([T0 - 98, T0 - 99]);
    expect(page.latest_listen_ts).toBe(T0 - 98);
    expect(page.oldest_listen_ts).toBe(T0 - 100);
  });

  test("list validates its parameters", async () => {
    const { user } = await s.auth.createUser("alice");
    await rejects(s.listens.list(user, { count: "-1" }), 400);
    await rejects(s.listens.list(user, { min_ts: "10", max_ts: "5" }), 400);
    expect((await s.listens.list(user, { count: "5000" })).count).toBe(0);
  });

  test("playing_now is stored separately and expires", async () => {
    const { user } = await s.auth.createUser("alice");
    await s.listens.submit(user, {
      listen_type: "playing_now",
      payload: [{ track_metadata: { ...track(1), additional_info: { duration_ms: 30_000 } } }],
    });
    expect(repos._listens).toHaveLength(0);
    expect((await s.listens.current(user))?.track_name).toBe("Track 1");
    now += 31;
    expect(await s.listens.current(user)).toBeNull();
  });

  test("delete removes one listen", async () => {
    const { user } = await s.auth.createUser("alice");
    await s.listens.submit(user, { listen_type: "single", payload: [{ listened_at: T0, track_metadata: track(1) }] });
    const [listen] = (await s.listens.list(user, {})).listens;
    await rejects(s.listens.delete(user, { listened_at: T0 }), 400);
    await s.listens.delete(user, { listened_at: T0, recording_msid: listen?.recording_msid });
    expect(repos._listens).toHaveLength(0);
  });
});

describe("users, imports, stats", () => {
  test("requireByName is case-insensitive and 404s", async () => {
    await s.auth.createUser("Alice");
    expect((await s.users.requireByName("alice")).name).toBe("Alice");
    await rejects(s.users.requireByName("bob"), 404);
  });

  test("latest import round-trips per service", async () => {
    const { user } = await s.auth.createUser("alice");
    expect(await s.imports.latest(user, undefined)).toBe(0);
    await s.imports.update(user, { ts: T0 });
    await s.imports.update(user, { ts: 5, service: "spotify" });
    expect(await s.imports.latest(user, "lastfm")).toBe(T0);
    expect(await s.imports.latest(user, "spotify")).toBe(5);
    await rejects(s.imports.update(user, { ts: -1 }), 400);
    await rejects(s.imports.latest(user, "Bad Service"), 400);
  });

  test("stats are cached by listen count", async () => {
    const { user } = await s.auth.createUser("alice");
    await s.listens.submit(user, { listen_type: "import", payload: [0, 1, 2].map((i) => ({ listened_at: T0 - i, track_metadata: track(i) })) });
    const fresh = await s.users.requireByName("alice");
    const first = await s.stats.top(fresh, "artists", {});
    expect(first.rows.map((r) => [r.artistName, r.listenCount])).toEqual([
      ["Artist 0", 2],
      ["Artist 1", 1],
    ]);
    expect(first.total).toBe(2);

    // Same listen count -> served from cache even though the repository changed underneath.
    repos._listens.length = 0;
    expect(await s.stats.top(fresh, "artists", {})).toEqual(first);
    // New listen count -> recomputed.
    expect((await s.stats.top({ ...fresh, listenCount: 0 }, "artists", {})).total).toBe(0);
    await rejects(s.stats.top(fresh, "artists", { range: "decade" }), 400);
  });
});
