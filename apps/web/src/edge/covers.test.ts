import { describe, expect, test, vi } from "vite-plus/test";
import {
  cleanTitle,
  findCover,
  handleCovers,
  primaryArtist,
  readArtworkQuery,
  readCoverQuery,
  storageKey,
  type ArtworkBucket,
  searches,
} from "./covers.ts";
import { lookupUrl } from "../ui/cover/artwork.ts";

const IMG = "https://cdn-images.dzcdn.net/images/cover/abc/500x500-000000-80-0-0.jpg";

function deezer(byPath: (path: string) => unknown) {
  return vi.fn(async (input: string) => Response.json(byPath(input)));
}

describe("cover lookup", () => {
  test("queries come from the URL the page builds", () => {
    const url = lookupUrl({ kind: "album", artist: "Jennie", album: "Ruby" }, 500)!;
    expect(readCoverQuery(new URL(url, "https://x"))).toEqual({
      kind: "album",
      artist: "Jennie",
      album: "Ruby",
      track: undefined,
      size: "big",
    });
    expect(readCoverQuery(new URL("https://x/covers?artist=A"))).toBeNull();
    expect(lookupUrl({ kind: "album", artist: "A" })).toBeNull();
  });

  test("the lead artist of a credit", () => {
    expect(primaryArtist("Peso Pluma & Estevan Plazola")).toBe("Peso Pluma");
    expect(primaryArtist("Peso Pluma\n & \nEstevan Plazola".replace(/\s+/g, " "))).toBe(
      "Peso Pluma",
    );
    expect(primaryArtist("Jennie feat. Doechii")).toBe("Jennie");
    expect(primaryArtist("Peso Pluma, Tito Double P")).toBe("Peso Pluma");
    expect(primaryArtist("Bad Bunny x Jhayco")).toBe("Bad Bunny");
    expect(primaryArtist("Charli XCX")).toBe("Charli XCX");
    expect(primaryArtist("Nicki Minaj")).toBe("Nicki Minaj");
  });

  test("full credit first, then the lead artist", () => {
    const q = readCoverQuery(
      new URL("https://x/covers?artist=Peso%20Pluma%20%26%20Estevan%20Plazola&album=B"),
    )!;
    const all = searches(q);
    expect(all).toHaveLength(4);
    expect(decodeURIComponent(all[0]!)).toContain('artist:"Peso Pluma & Estevan Plazola"');
    expect(decodeURIComponent(all[2]!)).toContain('artist:"Peso Pluma"');
  });

  test("titles lose decorations that make search miss", () => {
    expect(cleanTitle("Été avec toi - Single")).toBe("Été avec toi");
    expect(cleanTitle("Pink Friday (Deluxe Edition)")).toBe("Pink Friday");
    expect(cleanTitle("The Pinkprint (Bonus Video Version)")).toBe("The Pinkprint");
    expect(cleanTitle("Kid A")).toBe("Kid A");
  });

  test("precise search first, then loose, then by track", async () => {
    const q = readCoverQuery(new URL("https://x/covers?artist=A&album=B&track=C"))!;
    expect(searches(q)).toHaveLength(4);
    const fetcher = deezer((path) =>
      path.includes("/search?") ? { data: [{ album: { cover_big: IMG } }] } : { data: [] },
    );
    expect(await findCover(q, fetcher as unknown as typeof fetch)).toBe(IMG);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  test("Deezer's empty artist picture is not artwork", async () => {
    const q = readCoverQuery(new URL("https://x/covers?kind=artist&artist=Nobody"))!;
    const fetcher = deezer(() => ({
      data: [
        { picture_big: "https://cdn-images.dzcdn.net/images/artist//500x500-000000-80-0-0.jpg" },
      ],
    }));
    expect(await findCover(q, fetcher as unknown as typeof fetch)).toBeNull();
  });

  test("a search hit by Deezer's quota is retried after a pause", async () => {
    let calls = 0;
    const fetcher = deezer(() =>
      ++calls === 1
        ? { error: { code: 4, message: "Quota limit exceeded" } }
        : { data: [{ cover_medium: IMG }] },
    );
    const sleeps: number[] = [];
    const image = await findCover(
      { kind: "album", artist: "A", album: "B", size: "medium" },
      fetcher as unknown as typeof fetch,
      async (ms) => void sleeps.push(ms),
    );
    expect(image).toBe(IMG);
    expect(sleeps).toEqual([800]);
  });
});

/** A Map-backed R2 double that records writes. */
function memoryBucket() {
  const objects = new Map<
    string,
    { bytes: ArrayBuffer; contentType?: string; meta?: Record<string, string> }
  >();
  const bucket: ArtworkBucket & { objects: typeof objects } = {
    objects,
    async get(key) {
      const o = objects.get(key);
      if (!o) return null;
      return {
        body: new Response(o.bytes).body,
        arrayBuffer: async () => o.bytes,
        httpMetadata: { contentType: o.contentType },
        customMetadata: o.meta,
      };
    },
    async put(key, value, options) {
      const bytes =
        typeof value === "string" ? (new TextEncoder().encode(value).buffer as ArrayBuffer) : value;
      objects.set(key, {
        bytes,
        contentType: options?.httpMetadata?.contentType,
        meta: options?.customMetadata,
      });
    },
  };
  return bucket;
}

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).buffer;

/** Deezer search answers (JSON) plus the image downloads, from one fake fetch. */
function sources(searchBody: () => unknown) {
  return vi.fn(async (input: string) =>
    input.startsWith("https://api.deezer.com")
      ? Response.json(searchBody())
      : new Response(JPEG, { headers: { "content-type": "image/jpeg" } }),
  );
}

describe("stored artwork", () => {
  test("resolved once, stored in R2, then served from R2 for every size", async () => {
    const bucket = memoryBucket();
    const fetcher = sources(() => ({ data: [{ cover_big: IMG }] }));
    const deps = { bucket, fetcher: fetcher as unknown as typeof fetch };
    const first = await handleCovers(
      new Request("https://apollon.example/covers?artist=A&album=B&size=medium&v=3"),
      deps,
    );
    expect(first.status).toBe(200);
    expect(first.headers.get("content-type")).toBe("image/jpeg");
    expect(first.headers.get("cache-control")).toContain("immutable");
    expect(new Uint8Array(await first.arrayBuffer())).toEqual(new Uint8Array(JPEG));
    expect(bucket.objects.size).toBe(1);
    const calls = fetcher.mock.calls.length;

    const again = await handleCovers(
      new Request("https://apollon.example/covers?artist=a%20&album=b&size=big&v=3&retry=1"),
      deps,
    );
    expect(again.status).toBe(200);
    expect(fetcher.mock.calls.length).toBe(calls); // no outside call at all
  });

  test("a release MBID comes from the Cover Art Archive, stored the same way", async () => {
    const bucket = memoryBucket();
    const mbid = "8f3471b5-7e6a-48da-86a9-c1c07a0f47ae";
    const fetcher = sources(() => ({ data: [] }));
    const res = await handleCovers(
      new Request(`https://apollon.example/covers?mbid=${mbid.toUpperCase()}&size=big`),
      { bucket, fetcher: fetcher as unknown as typeof fetch },
    );
    expect(res.status).toBe(200);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      `https://coverartarchive.org/release/${mbid}/front-500`,
    );
    expect([...bucket.objects.keys()]).toEqual([`v1/release/${mbid}`]);
    expect(readArtworkQuery(new URL("https://x/covers?mbid=nope"))).toBeNull();
  });

  test("a miss is stored as a marker and not looked up again until it expires", async () => {
    const bucket = memoryBucket();
    let now = 1_000_000;
    const fetcher = sources(() => ({ data: [] }));
    const deps = { bucket, fetcher: fetcher as unknown as typeof fetch, now: () => now };
    const req = () => new Request("https://apollon.example/covers?artist=Nobody&album=Nothing");
    expect((await handleCovers(req(), deps)).status).toBe(404);
    const calls = fetcher.mock.calls.length;
    expect((await handleCovers(req(), deps)).status).toBe(404);
    expect(fetcher.mock.calls.length).toBe(calls);
    now += 8 * 86_400_000;
    await handleCovers(req(), deps);
    expect(fetcher.mock.calls.length).toBeGreaterThan(calls);
  });

  test("a failed lookup is not stored (503), so the next view retries", async () => {
    const bucket = memoryBucket();
    const fetcher = sources(() => ({ error: { code: 4 } }));
    const res = await handleCovers(new Request("https://apollon.example/covers?artist=A&album=Q"), {
      bucket,
      fetcher: fetcher as unknown as typeof fetch,
      sleep: async () => {},
    });
    expect(res.status).toBe(503);
    expect(bucket.objects.size).toBe(0);
  });

  test("identical lookups at once share one resolution", async () => {
    const bucket = memoryBucket();
    const fetcher = sources(() => ({ data: [{ cover_big: IMG }] }));
    const deps = { bucket, fetcher: fetcher as unknown as typeof fetch };
    const url = "https://apollon.example/covers?artist=Same&album=Same";
    const [a, b] = await Promise.all([
      handleCovers(new Request(url), deps),
      handleCovers(new Request(url), deps),
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect((await a.arrayBuffer()).byteLength).toBe(JPEG.byteLength);
    expect((await b.arrayBuffer()).byteLength).toBe(JPEG.byteLength);
    const searches = fetcher.mock.calls.filter(([u]) =>
      String(u).startsWith("https://api.deezer.com"),
    );
    expect(searches).toHaveLength(1);
  });

  test("storage keys ignore case and spacing, and differ between albums", async () => {
    const a = await storageKey({ kind: "album", artist: "Air", album: "Moon Safari", size: "big" });
    expect(
      await storageKey({ kind: "album", artist: " AIR", album: "moon  safari", size: "medium" }),
    ).toBe(a);
    expect(
      await storageKey({ kind: "album", artist: "Air", album: "Talkie Walkie", size: "big" }),
    ).not.toBe(a);
    expect(await storageKey({ kind: "artist", artist: "Air", size: "big" })).toMatch(
      /^v1\/artist\//,
    );
  });
});
