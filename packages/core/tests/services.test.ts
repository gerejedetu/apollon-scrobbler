import { beforeEach, describe, expect, test } from "vite-plus/test";
import {
  ApiError,
  MemoryCache,
  createServices,
  tokenFromHeader,
  type Services,
} from "../src/index.ts";
import { fakeRepositories, fakeVerifier } from "./fakes.ts";

const T0 = 1_700_000_000;
let now = T0;
let repos: ReturnType<typeof fakeRepositories>;
let s: Services;
let tokens: Map<string, string>;

const track = (n: number) => ({ artist_name: `Artist ${n % 2}`, track_name: `Track ${n}` });

beforeEach(() => {
  now = T0;
  repos = fakeRepositories();
  tokens = new Map();
  s = createServices(repos, fakeVerifier(tokens), {
    clock: () => now,
    cache: new MemoryCache(),
    authCache: new MemoryCache(),
    cacheMinListens: 0,
  });
});

/** Creates a profile for a new account and a token for it, as the identity provider would. */
async function signUp(name: string) {
  const authId = `auth-${name}`;
  const user = await s.users.createProfile(authId, name);
  const token = `token-${name}`;
  tokens.set(token, authId);
  return { user, token };
}

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

  test("a verified token resolves to its profile; unknown tokens are rejected", async () => {
    const { user, token } = await signUp("alice");
    expect(await s.auth.requireUser(`Token ${token}`)).toMatchObject({
      id: user.id,
      name: "alice",
    });
    await rejects(s.auth.requireUser(undefined), 401);
    await rejects(s.auth.requireUser("Token nope"), 401);
  });

  test("token checks are cached briefly; without a cache revocation is immediate", async () => {
    const { token } = await signUp("alice");
    await s.auth.requireUser(`Token ${token}`);
    tokens.delete(token);
    expect((await s.auth.requireUser(`Token ${token}`)).name).toBe("alice");
    const uncached = createServices(repos, fakeVerifier(tokens), { clock: () => now });
    await rejects(uncached.auth.requireUser(`Token ${token}`), 401);
  });

  test("profiles: names are unique (case-insensitive) and validated", async () => {
    await signUp("alice");
    await rejects(s.users.createProfile("auth-other", "ALICE"), 409);
    await rejects(s.users.createProfile("auth-x", "bad name!"), 400);
  });
});

describe("listens", () => {
  test("submit stores listens, dedupes, and lists newest first", async () => {
    const { user } = await signUp("alice");
    const payload = [0, 1, 2].map((i) => ({ listened_at: T0 - 100 + i, track_metadata: track(i) }));
    expect(await s.listens.submit(user, { listen_type: "import", payload })).toEqual({
      accepted: 3,
      inserted: 3,
    });
    expect(await s.listens.submit(user, { listen_type: "import", payload })).toEqual({
      accepted: 3,
      inserted: 0,
    });

    const page = await s.listens.list(user, { count: "2" });
    expect(page.count).toBe(2);
    expect(page.listens.map((l) => l.listened_at)).toEqual([T0 - 98, T0 - 99]);
    expect(page.latest_listen_ts).toBe(T0 - 98);
    expect(page.oldest_listen_ts).toBe(T0 - 100);
  });

  test("list validates its parameters", async () => {
    const { user } = await signUp("alice");
    await rejects(s.listens.list(user, { count: "-1" }), 400);
    await rejects(s.listens.list(user, { min_ts: "10", max_ts: "5" }), 400);
    expect((await s.listens.list(user, { count: "5000" })).count).toBe(0);
  });

  test("playing_now is stored separately and expires", async () => {
    const { user } = await signUp("alice");
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
    const { user } = await signUp("alice");
    await s.listens.submit(user, {
      listen_type: "single",
      payload: [{ listened_at: T0, track_metadata: track(1) }],
    });
    const [listen] = (await s.listens.list(user, {})).listens;
    await rejects(s.listens.delete(user, { listened_at: T0 }), 400);
    await s.listens.delete(user, { listened_at: T0, recording_msid: listen?.recording_msid });
    expect(repos._listens).toHaveLength(0);
  });
});

describe("users, imports, stats", () => {
  test("requireByName is case-insensitive and 404s", async () => {
    await signUp("Alice");
    expect((await s.users.requireByName("alice")).name).toBe("Alice");
    await rejects(s.users.requireByName("bob"), 404);
  });

  test("latest import round-trips per service", async () => {
    const { user } = await signUp("alice");
    expect(await s.imports.latest(user, undefined)).toBe(0);
    await s.imports.update(user, { ts: T0 });
    await s.imports.update(user, { ts: 5, service: "spotify" });
    expect(await s.imports.latest(user, "lastfm")).toBe(T0);
    expect(await s.imports.latest(user, "spotify")).toBe(5);
    await rejects(s.imports.update(user, { ts: -1 }), 400);
    await rejects(s.imports.latest(user, "Bad Service"), 400);
  });

  test("stats are cached by listen count", async () => {
    const { user } = await signUp("alice");
    await s.listens.submit(user, {
      listen_type: "import",
      payload: [0, 1, 2].map((i) => ({ listened_at: T0 - i, track_metadata: track(i) })),
    });
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

describe("private profiles", () => {
  test("a private profile is readable by its owner only, and looks unknown to others", async () => {
    const { user: alice } = await signUp("alice");
    const { user: bob } = await signUp("bob");
    expect((await s.users.requireReadable("alice", null)).name).toBe("alice");
    const hidden = await s.users.setPrivate(alice, true);
    expect(hidden.isPrivate).toBe(true);
    expect((await s.users.requireReadable("alice", hidden)).name).toBe("alice");
    await rejects(s.users.requireReadable("alice", bob), 404);
    await rejects(s.users.requireReadable("alice", null), 404);
    await rejects(s.users.setPrivate(alice, "yes"), 400);
    await s.users.setPrivate(alice, false);
    expect((await s.users.requireReadable("alice", null)).isPrivate).toBe(false);
  });
});

describe("more stats", () => {
  const DAY = 86_400;
  // 2023-11-14 22:13:20 UTC is T0.
  async function seed() {
    const { user } = await signUp("alice");
    const at = [T0 - 2 * DAY, T0 - 2 * DAY + 60, T0, T0 + 7200];
    await s.listens.submit(user, {
      listen_type: "import",
      payload: at.map((t, i) => ({
        listened_at: t,
        track_metadata: {
          artist_name: i === 3 ? "Moby" : "Air",
          track_name: `T${i % 2}`,
          release_name: "R",
        },
      })),
    });
    return s.users.requireByName("alice");
  }

  test("activity fills empty days with 0 and follows the UTC offset", async () => {
    const user = await seed();
    now = T0 + 8000;
    const utc = await s.stats.activity(user, {});
    expect(utc.data).toEqual([
      { date: "2023-11-12", listenCount: 2 },
      { date: "2023-11-13", listenCount: 0 },
      { date: "2023-11-14", listenCount: 1 },
      { date: "2023-11-15", listenCount: 1 },
    ]);
    // +2 h: T0 (22:13 UTC) moves to the 15th, next to T0 + 7200.
    const paris = await s.stats.activity(user, { utcOffset: "120" });
    expect(paris.data.at(-1)).toEqual({ date: "2023-11-15", listenCount: 2 });
    await rejects(s.stats.activity(user, { utcOffset: "9999" }), 400);
  });

  test("summary counts listens, artists, recordings and releases", async () => {
    const user = await seed();
    now = T0 + 8000;
    expect((await s.stats.summary(user, {})).data).toEqual({
      listenCount: 4,
      artistCount: 2,
      recordingCount: 3,
      releaseCount: 2,
      firstListenedAt: T0 - 2 * DAY,
      lastListenedAt: T0 + 7200,
    });
  });

  test("artist page lists top tracks; unknown artists are 404", async () => {
    const user = await seed();
    now = T0 + 8000;
    const air = await s.stats.artist(user, "Air", {});
    expect(air.data).toMatchObject({
      artistName: "Air",
      listenCount: 3,
      trackCount: 2,
      topTracks: [
        { trackName: "T0", listenCount: 2 },
        { trackName: "T1", listenCount: 1 },
      ],
    });
    await rejects(s.stats.artist(user, "Nobody", {}), 404);
  });
});

describe("cache policy", () => {
  test("small histories skip the stats cache; not-found results are never cached", async () => {
    const { user } = await signUp("alice");
    const cache = new MemoryCache();
    let writes = 0;
    const counting = {
      get: cache.get.bind(cache),
      set: async (...a: Parameters<MemoryCache["set"]>) => (writes++, cache.set(...a)),
    };
    await s.listens.submit(user, {
      listen_type: "single",
      payload: [{ listened_at: T0, track_metadata: track(1) }],
    });
    const fresh = await s.users.requireByName("alice");

    const small = createServices(repos, fakeVerifier(tokens), {
      clock: () => now,
      cache: counting,
      cacheMinListens: 5000,
    });
    await small.stats.top(fresh, "artists", {});
    expect(writes).toBe(0);

    const big = createServices(repos, fakeVerifier(tokens), {
      clock: () => now,
      cache: counting,
      cacheMinListens: 0,
    });
    await big.stats.top(fresh, "artists", {});
    expect(writes).toBe(1);
    await rejects(big.stats.artist(fresh, "Nobody", {}), 404);
    expect(writes).toBe(1);
  });
});

describe("one name per artist", () => {
  test("a bilingual credit joins the artist the library already has, and teaches its other forms", async () => {
    const { user } = await signUp("alice");
    const one = (artist: string, t: number) => ({
      listen_type: "single",
      payload: [
        { listened_at: T0 + t, track_metadata: { artist_name: artist, track_name: `T${t}` } },
      ],
    });
    await s.listens.submit(user, one("Heize", 1));
    await s.listens.submit(user, one("헤이즈 Heize", 2));
    await s.listens.submit(user, one("헤이즈", 3));
    await s.listens.submit(user, {
      listen_type: "playing_now",
      payload: [{ track_metadata: { artist_name: "헤이즈 Heize", track_name: "Now" } }],
    });
    expect(repos._listens.map((l) => l.artistName)).toEqual(["Heize", "Heize", "Heize"]);
    expect((await s.listens.current(user))?.artist_name).toBe("Heize");
  });
});
