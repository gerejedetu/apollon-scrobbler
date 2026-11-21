/**
 * Warms the artwork store: asks the deployed /covers for every artist, album and track a user has, so that
 * each image is resolved and stored in R2 once, slowly, instead of during page views.
 *
 *   vpx scripts/warm-covers.ts https://your.domain username          (public profile)
 *   SCROBBLER_TOKEN=… vpx scripts/warm-covers.ts https://your.domain username   (private profile)
 *
 * Safe to run again: stored images and stored misses answer without any outside lookup.
 */
import { artworkSources, type Lookup } from "../src/ui/cover/artwork.ts";

const [base, user] = process.argv.slice(2);
if (!base || !user) {
  console.error("usage: vpx scripts/warm-covers.ts <https://domain> <username>");
  process.exit(1);
}
const headers: Record<string, string> = process.env.SCROBBLER_TOKEN
  ? { authorization: `Bearer ${process.env.SCROBBLER_TOKEN}` }
  : {};
const CONCURRENCY = 2;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(new URL(path, base), { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

interface Item {
  artist: string;
  track?: string | null;
  album?: string | null;
  mbids?: { release?: string | null };
}

/** Every page of a top list. */
async function all(entity: "artists" | "recordings" | "releases"): Promise<Item[]> {
  const out: Item[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await getJson<{ total: number; items: Item[] }>(
      `/v1/users/${encodeURIComponent(user!)}/stats/${entity}?range=all_time&limit=100&offset=${offset}`,
    );
    out.push(...page.items);
    if (offset + 100 >= page.total) return out;
  }
}

/** Every listen (history rows show one cover each). */
async function listens(): Promise<Item[]> {
  const out: Item[] = [];
  let before: number | null | undefined;
  do {
    const q = before ? `&before=${before}` : "";
    const page = await getJson<{ listens: Item[]; next: number | null }>(
      `/v1/users/${encodeURIComponent(user!)}/listens?limit=1000${q}`,
    );
    out.push(...page.listens);
    before = page.next;
  } while (before);
  return out;
}

const [artists, releases, recordings, history] = await Promise.all([
  all("artists"),
  all("releases"),
  all("recordings"),
  listens(),
]);

/** What each page asks for: the same source lists the browser builds (src/ui/cover/artwork.ts). */
const jobs = new Map<string, string[]>();
const add = (mbid: string | null | undefined, lookup: Lookup) => {
  const sources = artworkSources(mbid, lookup, 500);
  if (sources.length) jobs.set(sources.join("|"), sources);
};
for (const a of artists) add(null, { kind: "artist", artist: a.artist });
for (const r of [...releases, ...recordings, ...history]) {
  add(r.mbids?.release, { kind: "album", artist: r.artist, album: r.album, track: r.track });
}

console.log(
  `${artists.length} artists, ${releases.length} albums, ${recordings.length} tracks, ${history.length} listens -> ${jobs.size} covers to check`,
);

const tally = { stored: 0, missing: 0, failed: 0 };
const queue = [...jobs.values()];

async function worker() {
  for (let sources = queue.shift(); sources; sources = queue.shift()) {
    let outcome: keyof typeof tally = "missing";
    // Like the browser: the first source that has an image wins.
    for (const src of sources) {
      let res = await fetch(new URL(src, base));
      for (let retry = 0; res.status === 503 && retry < 4; retry++) {
        await new Promise((r) => setTimeout(r, 3000 * (retry + 1)));
        res = await fetch(new URL(src, base));
      }
      await res.arrayBuffer();
      if (res.status === 200) {
        outcome = "stored";
        break;
      }
      if (res.status === 503) outcome = "failed";
    }
    tally[outcome]++;
    const done = tally.stored + tally.missing + tally.failed;
    if (done % 25 === 0) console.log(`${done}/${jobs.size}`, tally);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log("done", tally);
