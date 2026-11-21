import { describe, expect, test, vi } from "vite-plus/test";
import {
  cleanTitle,
  findCover,
  handleCovers,
  primaryArtist,
  readCoverQuery,
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

  test("answers a cached redirect, or a cached 404", async () => {
    const store = new Map<string, Response>();
    const cache = {
      match: async (r: Request) => store.get(r.url)?.clone(),
      put: async (r: Request, res: Response) => void store.set(r.url, res),
    };
    const hit = deezer(() => ({ data: [{ cover_medium: IMG }] }));
    const req = new Request("https://apollon.example/covers?artist=A&album=B&size=medium");
    const first = await handleCovers(req, { cache, fetcher: hit as unknown as typeof fetch });
    expect(first.status).toBe(302);
    expect(first.headers.get("location")).toBe(IMG);
    await handleCovers(req, { cache, fetcher: hit as unknown as typeof fetch });
    expect(hit).toHaveBeenCalledTimes(1);

    const miss = deezer(() => ({ data: [] }));
    const res = await handleCovers(new Request("https://apollon.example/covers?artist=A&album=Z"), {
      cache,
      fetcher: miss as unknown as typeof fetch,
    });
    expect(res.status).toBe(404);
    expect(
      (await handleCovers(new Request("https://apollon.example/covers"), { cache })).status,
    ).toBe(400);
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

  test("gives up (no cache) when the quota keeps failing", async () => {
    const fetcher = deezer(() => ({ error: { code: 4 } }));
    const store = new Map<string, Response>();
    const cache = {
      match: async (r: Request) => store.get(r.url)?.clone(),
      put: async (r: Request, res: Response) => void store.set(r.url, res),
    };
    const res = await handleCovers(
      new Request("https://apollon.example/covers?artist=A&album=Q&size=medium"),
      {
        cache,
        fetcher: fetcher as unknown as typeof fetch,
        sleep: async () => {},
      },
    );
    expect(res.status).toBe(503);
    expect(store.size).toBe(0);
  });

  test("identical lookups at once share one search, and the retry parameter shares the cache entry", async () => {
    const store = new Map<string, Response>();
    const cache = {
      match: async (r: Request) => store.get(r.url)?.clone(),
      put: async (r: Request, res: Response) => void store.set(r.url, res),
    };
    const hit = deezer(() => ({ data: [{ cover_medium: IMG }] }));
    const url = "https://apollon.example/covers?artist=Same&album=Same&size=medium&v=2";
    const deps = { cache, fetcher: hit as unknown as typeof fetch };
    const [a, b] = await Promise.all([
      handleCovers(new Request(url), deps),
      handleCovers(new Request(url), deps),
    ]);
    expect([a.status, b.status]).toEqual([302, 302]);
    expect(hit).toHaveBeenCalledTimes(1);
    const retried = await handleCovers(new Request(`${url}&retry=1`), deps);
    expect(retried.status).toBe(302);
    expect(hit).toHaveBeenCalledTimes(1);
  });
});
