/**
 * GET /covers: artwork served from our own domain.
 *   ?mbid=<release MBID>                       sleeve from the Cover Art Archive
 *   ?artist=…&album=… (or &track=…)            sleeve found by name on Deezer's public search (no key)
 *   ?artist=…&kind=artist                      artist picture found on Deezer
 *
 * Each image is resolved **once**, then its bytes are stored in R2 (bucket bound as ARTWORK) and served
 * from there forever with immutable cache headers: pages never depend on an outside service once a cover
 * is known. Misses are stored too (as a small marker, retried after MISS_TTL). Only a lookup that failed
 * (outside service down or over quota) is not stored, so the next view retries it.
 */
export const COVERS_PATH = "/covers";

const DEEZER = "https://api.deezer.com";
const CAA = "https://coverartarchive.org";
/** Stored images never change under their key. */
const IMMUTABLE = "public, max-age=31536000, immutable";
/** A stored miss is retried after this long (new releases get artwork later). */
const MISS_TTL = 7 * 86_400;
/**
 * Bumped when the name search gets smarter: misses stored by an older resolver are looked up again
 * (images already found are kept).
 */
const RESOLVER = "5";
/** Refuse anything bigger: a 500 px sleeve is ~30-80 KB. */
const MAX_IMAGE_BYTES = 2_000_000;
/**
 * Deezer's public API allows about 50 requests per 5 seconds. A page full of new covers fires dozens of
 * lookups at once, so they go through a small queue, and a search hit by the quota is retried after a pause.
 */
const MAX_CONCURRENT = 4;
const RETRY_DELAYS_MS = [800, 2000, 4500];

export interface CoverQuery {
  kind: "album" | "artist";
  artist: string;
  album?: string;
  track?: string;
  size: "medium" | "big";
  /** YouTube video a listen came from: its thumbnail stands in when the name finds nothing. */
  videoId?: string;
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A release sleeve by MusicBrainz id, or a name lookup. */
export type ArtworkQuery =
  | { kind: "release"; mbid: string }
  | { kind: "youtube"; videoId: string }
  | CoverQuery;

export function readArtworkQuery(url: URL): ArtworkQuery | null {
  const yt = url.searchParams.get("yt");
  if (yt && !url.searchParams.get("artist"))
    return YT_ID.test(yt) ? { kind: "youtube", videoId: yt } : null;
  const mbid = url.searchParams.get("mbid");
  if (mbid) return MBID.test(mbid) ? { kind: "release", mbid: mbid.toLowerCase() } : null;
  return readCoverQuery(url);
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
    videoId: (() => {
      const yt = url.searchParams.get("yt");
      return yt && YT_ID.test(yt) ? yt : undefined;
    })(),
  };
}

/** "Ruby (Deluxe Edition) - EP" → "Ruby": decorations that make search miss. */
export function cleanTitle(title: string): string {
  return (
    title
      .replace(/\s+-\s+(single|ep)$/i, "")
      // "Song feat. X" / "Song ft X" without brackets.
      .replace(/\s+(feat\.?|ft\.?|featuring)\s.*$/i, "")
      .replace(
        /\s*[([][^)\]]*(deluxe|edition|remaster|version|bonus|expanded|anniversary|feat\.?|with )[^)\]]*[)\]]/gi,
        "",
      )
      .trim()
  );
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

/**
 * The forms an artist name may be catalogued under, most likely first: as written, then for names like
 * "엄지 (UMJI)" the romanization in parentheses and the name outside them, then the lead artist of a credit.
 */
export function artistVariants(artist: string): string[] {
  const out = [artist];
  const paren = /^(.*?)\s*[(（]([^()（）]+)[)）]\s*$/.exec(artist);
  if (paren?.[1] && paren[2]) out.push(paren[2].trim(), paren[1].trim());
  out.push(primaryArtist(artist));
  return [...new Set(out.filter(Boolean))];
}

/** Searches to try, most precise first, for each form of the artist's name. */
export function searches(q: CoverQuery): string[] {
  return [...new Set(artistVariants(q.artist).flatMap((artist) => searchesFor({ ...q, artist })))];
}

function searchesFor(q: CoverQuery): string[] {
  const quote = (s: string) => `"${s.replace(/"/g, "")}"`;
  // Several results: homonyms are told apart below (exact name, most followed).
  if (q.kind === "artist") return [`/search/artist?q=${encodeURIComponent(q.artist)}&limit=10`];
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

/** Lower case, no accents, no punctuation: "Beyoncé (Live)" -> "beyonce live". */
export function fold(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function close(a: string, b: string): boolean {
  const x = fold(a);
  const y = fold(b);
  if (!x || !y) return false;
  return x === y || (x.length >= 3 && y.includes(x)) || (y.length >= 3 && x.includes(y));
}

/**
 * Whether a search result really is the asked artist / album / track. Loose searches ("artist title")
 * return *something* for almost any text, so a result is only used when its names match.
 */
/** Compilation albums credit "Various Artists" (or a translation) instead of each track's artist. */
const VARIOUS =
  /^(various( artists)?|va|artistes? divers|verschiedene interpreten|varios artistas|artisti vari)$/i;

export function matches(item: DeezerItem, q: CoverQuery, aliases: string[] = []): boolean {
  const artist = item.artist as { name?: unknown } | undefined;
  const artistName = typeof artist?.name === "string" ? artist.name : item.name;
  if (typeof artistName !== "string") return false;
  const album = item.album as { title?: unknown } | undefined;
  const isTrack = typeof album?.title === "string";
  const title = typeof item.title === "string" ? item.title : "";
  const sameArtist = [...artistVariants(q.artist), ...aliases].some((v) => close(v, artistName));
  if (q.kind === "artist") return sameArtist;
  const wantedAlbum = q.album ? cleanTitle(q.album) || q.album : null;
  const wantedTrack = q.track ? cleanTitle(q.track) || q.track : null;
  if (!isTrack) {
    // An album result: its title must match; a compilation may credit "Various Artists".
    return (
      wantedAlbum !== null &&
      close(wantedAlbum, title) &&
      (sameArtist || VARIOUS.test(fold(artistName)))
    );
  }
  // A track result: the same artist, and the same track (its cover is that recording's sleeve, even from
  // another album or compilation) or the same album.
  if (!sameArtist) return false;
  return (
    (wantedTrack !== null && close(wantedTrack, cleanTitle(title) || title)) ||
    (wantedAlbum !== null && close(wantedAlbum, String(album?.title)))
  );
}

export function pickImage(
  item: DeezerItem | undefined,
  q: CoverQuery,
  aliases: string[] = [],
): string | null {
  if (!item || !matches(item, q, aliases)) return null;
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
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<string | null | undefined> {
  if (q.kind === "artist") return findArtistPicture(q, fetcher, sleep);
  let failed = false;
  /** Results whose only problem is the artist's name: maybe the same artist written another way. */
  const otherNames: DeezerItem[] = [];
  for (const path of searches(q)) {
    const data = await search(path, fetcher, sleep);
    if (data === undefined) {
      failed = true;
      continue;
    }
    const image = pickImage(data[0], q);
    if (image) return image;
    const item = data[0];
    if (
      item &&
      otherScript(q.artist, itemArtist(item) ?? "") &&
      pickImage(item, q, [itemArtist(item) ?? ""])
    )
      otherNames.push(item);
  }
  // "헤이즈" vs "HEIZE", "BTS" vs "방탄소년단": ask MusicBrainz for the artist's other names and
  // accept a result only if its artist is one of them.
  if (otherNames.length > 0) {
    const aliases = await artistAliases(q.artist, fetcher);
    if (aliases === undefined) return undefined; // unverifiable now: retry later rather than guess
    for (const item of otherNames) {
      const image = pickImage(item, q, aliases);
      if (image) return image;
    }
  }
  return failed ? undefined : null;
}

/**
 * An artist's picture. Only an artist whose name is *exactly* one of the names asked for (or, for another
 * script, one of its MusicBrainz aliases) qualifies: "Jennie" is not "Jennie & the Gold Endeavor". Among
 * homonyms ("JENNIE", "Jennie"), the most followed one wins.
 */
async function findArtistPicture(
  q: CoverQuery,
  fetcher: typeof fetch,
  sleep: (ms: number) => Promise<void>,
): Promise<string | null | undefined> {
  let failed = false;
  const results: DeezerItem[] = [];
  for (const path of searches(q)) {
    const data = await search(path, fetcher, sleep);
    if (data === undefined) failed = true;
    else results.push(...data);
  }
  const best = (names: string[]) => {
    const wanted = new Set(names.map(fold));
    const exact = results.filter((r) => typeof r.name === "string" && wanted.has(fold(r.name)));
    const ranked = exact
      .map((r) => ({ r, image: pictureOf(r, q) }))
      .filter((x) => x.image)
      .sort((a, b) => Number(b.r.nb_fan ?? 0) - Number(a.r.nb_fan ?? 0));
    return ranked[0]?.image ?? null;
  };
  const direct = best(artistVariants(q.artist));
  if (direct) return direct;
  if (results.some((r) => otherScript(q.artist, typeof r.name === "string" ? r.name : ""))) {
    const aliases = await artistAliases(q.artist, fetcher);
    if (aliases === undefined) return undefined;
    const viaAlias = best(aliases);
    if (viaAlias) return viaAlias;
  }
  return failed ? undefined : null;
}

/** Letters outside Latin (Hangul, kana, Cyrillic…). */
const NON_LATIN = /[^\p{Script=Latin}\p{N}\p{P}\p{S}\s]/u;

/** Whether two names may be the same artist written in two scripts ("헤이즈" / "HEIZE"): worth asking MusicBrainz. */
function otherScript(a: string, b: string): boolean {
  return NON_LATIN.test(a) !== NON_LATIN.test(b);
}

function pictureOf(item: DeezerItem, q: CoverQuery): string | null {
  const value = item[`picture_${q.size}`];
  return typeof value === "string" && value.startsWith("https://") && !value.includes("/artist//")
    ? value
    : null;
}

function itemArtist(item: DeezerItem): string | undefined {
  const artist = item.artist as { name?: unknown } | undefined;
  const name = typeof artist?.name === "string" ? artist.name : item.name;
  return typeof name === "string" ? name : undefined;
}

const MUSICBRAINZ = "https://musicbrainz.org/ws/2";
/** MusicBrainz asks clients to identify themselves and to stay around one request per second. */
const MB_USER_AGENT = "Apollon-Scrobbler/1.0 ( https://github.com/powpowchuuuu/stunning-winner )";
let mbNext = 0;

/**
 * Other names of an artist (spellings, scripts, real name) from MusicBrainz: the artists whose name or alias
 * matches, with a good score. `undefined` when MusicBrainz could not answer.
 */
export async function artistAliases(
  name: string,
  fetcher: typeof fetch = fetch,
): Promise<string[] | undefined> {
  const wait = mbNext - Date.now();
  mbNext = Math.max(Date.now(), mbNext) + 1100;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  try {
    const query = encodeURIComponent(
      `artist:"${name.replace(/"/g, "")}" OR alias:"${name.replace(/"/g, "")}"`,
    );
    const res = await fetcher(`${MUSICBRAINZ}/artist/?fmt=json&limit=5&query=${query}`, {
      headers: { "user-agent": MB_USER_AGENT, accept: "application/json" },
    });
    if (!res.ok) return undefined;
    const body = (await res.json()) as {
      artists?: {
        score?: number;
        name?: string;
        "sort-name"?: string;
        aliases?: { name?: string }[];
      }[];
    };
    if (!Array.isArray(body.artists)) return undefined;
    // Only artists that really carry this name (as their name or one of their aliases) lend their other
    // names; search scores alone vary too much (Heize scores 74 for her own Hangul alias).
    const wanted = fold(name);
    return body.artists.flatMap((a) => {
      const names = [a.name, a["sort-name"], ...(a.aliases ?? []).map((x) => x.name)].filter(
        (n): n is string => typeof n === "string" && n.length > 0,
      );
      return names.some((n) => fold(n) === wanted) ? names : [];
    });
  } catch {
    return undefined;
  }
}

/** One Deezer search through the queue, retried after a pause when the quota is hit. `undefined` = failed. */
async function search(
  path: string,
  fetcher: typeof fetch,
  sleep: (ms: number) => Promise<void>,
): Promise<DeezerItem[] | undefined> {
  for (let attempt = 0; ; attempt++) {
    const data = await queued(async () => {
      try {
        const res = await fetcher(DEEZER + path, { headers: { accept: "application/json" } });
        const body = res.ok
          ? ((await res.json()) as { data?: DeezerItem[]; error?: unknown })
          : null;
        // Deezer reports quota errors with a 200 and an `error` object.
        return !body || body.error || !Array.isArray(body.data) ? undefined : body.data;
      } catch {
        return undefined;
      }
    });
    const delay = RETRY_DELAYS_MS[attempt];
    if (data !== undefined || delay === undefined) return data;
    await sleep(delay);
  }
}

/** Per-isolate queue: at most MAX_CONCURRENT Deezer calls in flight. */
let inFlight = 0;
const waiting: (() => void)[] = [];

async function queued<T>(task: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  inFlight++;
  try {
    return await task();
  } finally {
    inFlight--;
    waiting.shift()?.();
  }
}

/** The R2 bucket, typed structurally (tests pass a Map-backed double). */
export interface ArtworkBucket {
  get(key: string): Promise<{
    body: ReadableStream | null;
    arrayBuffer(): Promise<ArrayBuffer>;
    httpMetadata?: { contentType?: string };
    customMetadata?: Record<string, string>;
  } | null>;
  put(
    key: string,
    value: ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> },
  ): Promise<unknown>;
}

interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

const norm = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();

/** Where an image lives in R2: one object per release or per normalized name, whatever size is asked. */
export async function storageKey(q: ArtworkQuery): Promise<string> {
  if (q.kind === "release") return `v1/release/${q.mbid}`;
  if (q.kind === "youtube") return `v1/youtube/${q.videoId}`;
  const name =
    q.kind === "artist"
      ? norm(q.artist)
      : // An album is one sleeve whichever of its tracks asks; the track only counts when there is no album.
        `${norm(q.artist)}\u0000${norm(q.album)}\u0000${q.album ? "" : norm(q.track)}`;
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(name)),
  );
  const hex = [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
  // v2: results are checked against the names (v1 could hold a wrong match from a loose search).
  // Artists v3: exact names only (v2 could hold a homonym such as "Jennie & the Gold Endeavor").
  return `${q.kind === "artist" ? "v3" : "v2"}/${q.kind}/${hex}`;
}

type Fetched = { bytes: ArrayBuffer; contentType: string } | null | undefined;

/** Downloads an image: `null` when the source has none (404), `undefined` when it failed. */
async function download(url: string, fetcher: typeof fetch): Promise<Fetched> {
  try {
    const res = await fetcher(url, { redirect: "follow" });
    if (res.status === 404) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.startsWith("image/")) return undefined;
    const bytes = await res.arrayBuffer();
    return bytes.byteLength > 0 && bytes.byteLength <= MAX_IMAGE_BYTES
      ? { bytes, contentType }
      : undefined;
  } catch {
    return undefined;
  }
}

/** Finds and downloads the image of a query (always the 500 px variant; smaller views scale it down). */
export async function resolveArtwork(
  q: ArtworkQuery,
  fetcher: typeof fetch = fetch,
  sleep?: (ms: number) => Promise<void>,
): Promise<Fetched> {
  if (q.kind === "release") return download(`${CAA}/release/${q.mbid}/front-500`, fetcher);
  if (q.kind === "youtube") return thumbnail(q.videoId, fetcher);
  const url = await findCover({ ...q, size: "big" }, fetcher, sleep);
  if (url === null && q.videoId) return thumbnail(q.videoId, fetcher);
  if (url === null || url === undefined) return url;
  return queued(() => download(url, fetcher));
}

/** The largest thumbnail of a YouTube video when it has one, else the always-present 480x360. */
async function thumbnail(videoId: string, fetcher: typeof fetch): Promise<Fetched> {
  const big = await download(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, fetcher);
  return big ?? download(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, fetcher);
}

/** The same cover asked several times at once (two rows of one page) is resolved once per isolate. */
const pending = new Map<string, Promise<Fetched>>();

function imageResponse(body: BodyInit | null, contentType: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": contentType, "cache-control": IMMUTABLE },
  });
}

/**
 * Misses are short-lived in browsers: a name with no artwork today can get one later (another listen brings
 * its video thumbnail), and a long-cached 404 would hide it. The real memory of misses is in R2.
 */
const missResponse = () =>
  new Response(null, { status: 404, headers: { "cache-control": "public, max-age=300" } });

/**
 * An album with no artwork of its own takes the stored cover of its track: a single is usually named like
 * its track ("Lemon" by 엄지 (UMJI)), and that track may already have an image (for example its video's
 * thumbnail, learned from a listen). The image is copied under the album's key for next time.
 */
async function borrowTrackCover(
  q: ArtworkQuery,
  bucket: ArtworkBucket | undefined,
  albumKey: string,
): Promise<Response | null> {
  if (!bucket || q.kind !== "album" || !q.album) return null;
  for (const track of new Set([q.track, q.album].filter((t): t is string => Boolean(t)))) {
    const object = await bucket.get(
      await storageKey({ kind: "album", artist: q.artist, track, size: q.size }),
    );
    if (!object || Number(object.customMetadata?.missUntil ?? 0)) continue;
    const bytes = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType ?? "image/jpeg";
    await bucket.put(albumKey, bytes.slice(0), { httpMetadata: { contentType } });
    return imageResponse(bytes, contentType);
  }
  return null;
}

export async function handleCovers(
  request: Request,
  deps: {
    bucket?: ArtworkBucket;
    cache?: EdgeCache;
    fetcher?: typeof fetch;
    waitUntil?: (p: Promise<unknown>) => void;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
  } = {},
): Promise<Response> {
  const url = new URL(request.url);
  const q = readArtworkQuery(url);
  if (!q) return new Response("Bad cover query", { status: 400 });
  const key = await storageKey(q);
  const now = (deps.now ?? Date.now)();
  // Background writes: after the response when the runtime allows it, else awaited (nothing is lost).
  const later = async (p: Promise<unknown> | undefined) => {
    if (!p) return;
    const safe = p.catch(() => {});
    if (deps.waitUntil) deps.waitUntil(safe);
    else await safe;
  };
  // 1. Edge cache of this data centre (free), keyed by the storage key: every size and URL variant shares it.
  const cacheRequest = new Request(new URL(`${COVERS_PATH}/${key}`, url.origin).toString());
  const cached = await deps.cache?.match(cacheRequest);
  if (cached) return cached;

  // 2. R2: the image, or a miss marker that has not expired yet.
  const stored = await deps.bucket?.get(key);
  let skipSearch = false;
  if (stored) {
    const missUntil = Number(stored.customMetadata?.missUntil ?? 0);
    if (!missUntil) {
      const response = imageResponse(stored.body, stored.httpMetadata?.contentType ?? "image/jpeg");
      await later(deps.cache?.put(cacheRequest, response.clone()));
      return response;
    }
    // A stored miss still answers 404, unless this request brings a video thumbnail to stand in.
    const canFill = q.kind !== "release" && q.kind !== "youtube" && Boolean(q.videoId);
    if (missUntil > now && stored.customMetadata?.resolver === RESOLVER) {
      if (!canFill) {
        const borrowed = await borrowTrackCover(q, deps.bucket, key);
        return borrowed ?? missResponse();
      }
      // The name is known to have no artwork: go straight to the thumbnail.
      skipSearch = true;
    }
  }

  // 3. Resolve once (deduplicated), then store for good.
  let resolving = pending.get(key);
  if (!resolving) {
    resolving = (
      skipSearch && q.kind !== "release" && q.kind !== "youtube" && q.videoId
        ? thumbnail(q.videoId, deps.fetcher ?? fetch)
        : resolveArtwork(q, deps.fetcher, deps.sleep)
    ).finally(() => pending.delete(key));
    pending.set(key, resolving);
  }
  const image = await resolving;
  if (image === undefined) {
    return new Response(null, {
      status: 503,
      headers: { "cache-control": "no-store", "retry-after": "5" },
    });
  }
  if (image === null) {
    const borrowed = await borrowTrackCover(q, deps.bucket, key);
    if (borrowed) return borrowed;
    await later(
      deps.bucket?.put(key, "", {
        customMetadata: { missUntil: String(now + MISS_TTL * 1000), resolver: RESOLVER },
      }),
    );
    return missResponse();
  }
  // Each waiter of a deduplicated lookup gets its own copy of the bytes.
  await later(
    deps.bucket?.put(key, image.bytes.slice(0), {
      httpMetadata: { contentType: image.contentType },
    }),
  );
  const response = imageResponse(image.bytes.slice(0), image.contentType);
  await later(deps.cache?.put(cacheRequest, response.clone()));
  return response;
}
