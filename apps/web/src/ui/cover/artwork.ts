/**
 * Real artwork from the Cover Art Archive (MusicBrainz), by release MBID. Imports from Last.fm and most
 * scrobblers carry it. The image sits over the pattern, which stays when there is no artwork.
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
