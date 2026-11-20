/**
 * GET /covers?artist=…&album=…  (or &track=…, or kind=artist): finds artwork by name when a listen has no
 * MusicBrainz release, using Deezer's public search (no key). Answers a redirect to the image, or 404.
 * Answers are cached at the edge for 30 days (7 for misses), so each name is looked up once.
 */
export const COVERS_PATH = "/covers";

const DEEZER = "https://api.deezer.com";
const HIT_TTL = 30 * 86_400;
const MISS_TTL = 7 * 86_400;

export interface CoverQuery {
  kind: "album" | "artist";
  artist: string;
  album?: string;
  track?: string;
  size: "medium" | "big";
}

export function readCoverQuery(url: URL): CoverQuery | null {
  const artist = url.searchParams.get("artist")?.replace(/\s+/g, " ").trim();
  if (!artist || artist.length > 300) return null;
  const kind = url.searchParams.get("kind") === "artist" ? "artist" : "album";
  const album = url.searchParams.get("album")?.trim() || undefined;
  const track = url.searchParams.get("track")?.trim() || undefined;
  if (kind === "album" && !album && !track) return null;
  return {
    kind,
    artist,
    album,
    track,
    size: url.searchParams.get("size") === "medium" ? "medium" : "big",
  };
}

/** "Ruby (Deluxe Edition) - EP" → "Ruby": decorations that make search miss. */
export function cleanTitle(title: string): string {
  return title
    .replace(/\s+-\s+(single|ep)$/i, "")
    .replace(
      /\s*[([][^)\]]*(deluxe|edition|remaster|version|bonus|expanded|anniversary|feat\.?|with )[^)\]]*[)\]]/gi,
      "",
    )
    .trim();
}

/**
 * The lead artist of a credit: "Peso Pluma & Estevan Plazola" → "Peso Pluma", "A feat. B" → "A".
 * Only used as a fallback after the full credit, so names like "Earth, Wind & Fire" still match first.
 */
export function primaryArtist(artist: string): string {
  const lead = artist
    .split(/\s*(?:&|\+|,|;|\/|\s(?:feat\.?|ft\.?|featuring|with|avec|x|vs\.?|et|and)\s)\s*/i)[0]
    ?.trim();
  return lead || artist;
}

/** Searches to try, most precise first; then the same with the lead artist alone. */
export function searches(q: CoverQuery): string[] {
  const lead = primaryArtist(q.artist);
  const full = searchesFor(q);
  return lead === q.artist ? full : [...full, ...searchesFor({ ...q, artist: lead })];
}

function searchesFor(q: CoverQuery): string[] {
  const quote = (s: string) => `"${s.replace(/"/g, "")}"`;
  if (q.kind === "artist") return [`/search/artist?q=${encodeURIComponent(q.artist)}&limit=1`];
  const out: string[] = [];
  if (q.album) {
    const album = cleanTitle(q.album) || q.album;
    out.push(
      `/search/album?q=${encodeURIComponent(`artist:${quote(q.artist)} album:${quote(album)}`)}&limit=1`,
    );
    out.push(`/search/album?q=${encodeURIComponent(`${q.artist} ${album}`)}&limit=1`);
  }
  if (q.track) {
    const track = cleanTitle(q.track) || q.track;
    out.push(
      `/search?q=${encodeURIComponent(`artist:${quote(q.artist)} track:${quote(track)}`)}&limit=1`,
    );
    out.push(`/search?q=${encodeURIComponent(`${q.artist} ${track}`)}&limit=1`);
  }
  return out;
}

type DeezerItem = Record<string, unknown> & { album?: Record<string, unknown> };

export function pickImage(item: DeezerItem | undefined, q: CoverQuery): string | null {
  if (!item) return null;
  const key = q.kind === "artist" ? `picture_${q.size}` : `cover_${q.size}`;
  const value = item[key] ?? item.album?.[`cover_${q.size}`];
  // Deezer's placeholder for missing artist pictures has an empty hash ("/images/artist//").
  return typeof value === "string" &&
    value.startsWith("https://") &&
    !value.includes("//500x") &&
    !value.includes("//250x")
    ? value
    : null;
}

/**
 * The artwork, `null` when every search answered and none had artwork (a miss worth caching), or
 * `undefined` when a search failed (rate limit, network): then nothing is cached and the next view retries.
 */
export async function findCover(
  q: CoverQuery,
  fetcher: typeof fetch = fetch,
): Promise<string | null | undefined> {
  let failed = false;
  for (const path of searches(q)) {
    try {
      const res = await fetcher(DEEZER + path, { headers: { accept: "application/json" } });
      const body = res.ok ? ((await res.json()) as { data?: DeezerItem[]; error?: unknown }) : null;
      // Deezer reports quota errors with a 200 and an `error` object.
      if (!body || body.error || !Array.isArray(body.data)) {
        failed = true;
        continue;
      }
      const image = pickImage(body.data[0], q);
      if (image) return image;
    } catch {
      failed = true;
    }
  }
  return failed ? undefined : null;
}

interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export async function handleCovers(
  request: Request,
  deps: {
    cache?: EdgeCache;
    fetcher?: typeof fetch;
    waitUntil?: (p: Promise<unknown>) => void;
  } = {},
): Promise<Response> {
  const url = new URL(request.url);
  const q = readCoverQuery(url);
  if (!q) return new Response("Bad cover query", { status: 400 });
  const key = new Request(url.toString(), { method: "GET" });
  const cached = await deps.cache?.match(key);
  if (cached) return cached;
  const image = await findCover(q, deps.fetcher);
  if (image === undefined)
    return new Response(null, { status: 503, headers: { "cache-control": "no-store" } });
  const response = image
    ? new Response(null, {
        status: 302,
        headers: { location: image, "cache-control": `public, max-age=${HIT_TTL}` },
      })
    : new Response(null, {
        status: 404,
        headers: { "cache-control": `public, max-age=${MISS_TTL}` },
      });
  const put = deps.cache?.put(key, response.clone());
  if (put && deps.waitUntil) deps.waitUntil(put);
  else if (put) await put;
  return response;
}
