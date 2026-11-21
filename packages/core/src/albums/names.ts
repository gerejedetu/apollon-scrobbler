/**
 * Album names that arrive in several editions of one release.
 *
 * - Content advisories ("Midnights [Clean]", "… (Explicit)") are never a different album: always removed.
 * - Edition suffixes ("(Deluxe)", "(Remastered 2011)", "- Bonus Edition") may be a different track list,
 *   so they only join the plain album when the library already has it under that name.
 */

const ADVISORY =
  /\s*(?:[[(]\s*(?:clean|explicit)(?:\s+version)?\s*[\])]|-\s*(?:clean|explicit)(?:\s+version)?)\s*$/i;
const EDITION =
  /\s*(?:[[(][^\])]*\b(?:deluxe|edition|remaster(?:ed)?|bonus|expanded|anniversary)\b[^\])]*[\])]|-\s*(?:deluxe|remaster(?:ed)?|bonus|expanded|anniversary)\b.*)\s*$/i;
// Not "version": "1989 (Taylor's Version)" is a re-recording, a different album.

export function withoutAdvisory(album: string): string {
  return album.replace(ADVISORY, "").trim() || album;
}

/** The plain album an edition belongs to, or the name itself when it has no edition suffix. */
export function editionBase(album: string): string {
  return album.replace(EDITION, "").trim() || album;
}

/**
 * The album name to store: without its content advisory, and without its edition suffix when the
 * library (`known`, album names of the same artist) already has the plain album.
 */
export function canonicalAlbum(album: string, known: ReadonlySet<string>): string {
  const clean = withoutAdvisory(album);
  if (known.has(clean)) return clean;
  const base = editionBase(clean);
  return base !== clean && known.has(base) ? base : clean;
}

/** Whether an album name may need renaming (so that ordinary names cost no lookup). */
export function hasEditionMarker(album: string): boolean {
  return ADVISORY.test(album) || EDITION.test(album);
}
