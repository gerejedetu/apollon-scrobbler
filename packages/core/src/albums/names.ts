/**
 * Album names that arrive in several editions of one release.
 *
 * - Content advisories ("Midnights [Clean]", "… (Explicit)") are never a different album: always removed.
 * - Release-type store suffixes ("Love, Yerin - EP", "Song - Single", "X (EP)", "X [Single]") are labels a
 *   store adds to the title, never part of it: always removed too. A title that is only the word ("Single",
 *   "EP") is kept, and so is the word anywhere else in the title ("Single Ladies", "The EP Collection").
 * - Edition suffixes ("(Deluxe)", "(Remastered 2011)", "- Bonus Edition") may be a different track list,
 *   so they only join the plain album when the library already has it under that name.
 */

const ADVISORY =
  /\s*(?:[[(]\s*(?:clean|explicit)(?:\s+version)?\s*[\])]|-\s*(?:clean|explicit)(?:\s+version)?)\s*$/i;
const EDITION =
  /\s*(?:[[(][^\])]*\b(?:deluxe|edition|remaster(?:ed)?|bonus|expanded|anniversary)\b[^\])]*[\])]|-\s*(?:deluxe|remaster(?:ed)?|bonus|expanded|anniversary)\b.*)\s*$/i;
const RELEASE_TYPE = /\s*(?:[[(]\s*(?:ep|single)\s*[\])]|\s[-–—]\s*(?:ep|single))\s*$/i;
// Not "version": "1989 (Taylor's Version)" is a re-recording, a different album.

export function withoutAdvisory(album: string): string {
  return album.replace(ADVISORY, "").trim() || album;
}

/**
 * The title without the labels a store appends: content advisories and release types, in any order
 * ("X - EP [Explicit]", "X (Explicit) - Single").
 */
export function withoutStoreSuffixes(album: string): string {
  let name = album;
  for (;;) {
    const next = name.replace(ADVISORY, "").replace(RELEASE_TYPE, "").trim();
    if (!next || next === name) return next ? name : album;
    name = next;
  }
}

/** The plain album an edition belongs to, or the name itself when it has no edition suffix. */
export function editionBase(album: string): string {
  return album.replace(EDITION, "").trim() || album;
}

/**
 * The album name to store: without its content advisory and release-type suffix, and without its edition suffix when the
 * library (`known`, album names of the same artist) already has the plain album.
 */
export function canonicalAlbum(album: string, known: ReadonlySet<string>): string {
  const clean = withoutStoreSuffixes(album);
  if (known.has(clean)) return clean;
  const base = editionBase(clean);
  return base !== clean && known.has(base) ? base : clean;
}

/** Whether an album name may need renaming (so that ordinary names cost no lookup). */
export function hasEditionMarker(album: string): boolean {
  return ADVISORY.test(album) || RELEASE_TYPE.test(album) || EDITION.test(album);
}
