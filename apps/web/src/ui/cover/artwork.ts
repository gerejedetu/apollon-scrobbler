/**
 * Where a sleeve can come from, best first: the Cover Art Archive by release MBID, then the Worker's
 * /covers lookup by name (src/edge/covers.ts). When every source fails the generated pattern stays.
 */
const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ArtworkSize = 250 | 500;

export function artworkUrl(
  releaseMbid: string | null | undefined,
  size: ArtworkSize = 250,
): string | null {
  return releaseMbid && MBID.test(releaseMbid)
    ? `https://coverartarchive.org/release/${releaseMbid.toLowerCase()}/front-${size}`
    : null;
}

/** What to look up by name: an artist's picture, or an album's (or a track's album) sleeve. */
export type Lookup =
  | { kind: "artist"; artist: string }
  | { kind: "album"; artist: string; album?: string | null; track?: string | null };

export const LOOKUP_VERSION = "2";

export function lookupUrl(lookup: Lookup | undefined, size: ArtworkSize = 250): string | null {
  if (!lookup?.artist) return null;
  // `v` changes when the lookup gets smarter, so misses cached by an older version are retried.
  const params = new URLSearchParams({
    artist: lookup.artist,
    size: size === 250 ? "medium" : "big",
    v: LOOKUP_VERSION,
  });
  if (lookup.kind === "artist") params.set("kind", "artist");
  else {
    if (!lookup.album && !lookup.track) return null;
    if (lookup.album) params.set("album", lookup.album);
    else if (lookup.track) params.set("track", lookup.track);
  }
  return `/covers?${params.toString()}`;
}

export function artworkSources(
  mbid: string | null | undefined,
  lookup: Lookup | undefined,
  size: ArtworkSize,
): string[] {
  return [artworkUrl(mbid, size), lookupUrl(lookup, size)].filter((s): s is string => Boolean(s));
}
