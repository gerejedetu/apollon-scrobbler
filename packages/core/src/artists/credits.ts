/**
 * Splits an artist credit into the artists it names, so a joint listen counts for each of them:
 * "Peso Pluma & Estevan Plazola" → ["Peso Pluma", "Estevan Plazola"], "Jennie feat. Doechii" → both.
 *
 * Credits only carry names, so this is a heuristic, tuned to keep band names whole:
 * - "feat.", "ft.", "featuring", "with", "avec", "x", "vs." always separate artists;
 * - "&" and "," separate artists unless a part starts with "The" ("Bob Marley & The Wailers",
 *   "Tyler, The Creator") or the whole credit is a known band (KEEP_WHOLE);
 * - "and", "et", "+", "/" never split ("Florence + The Machine", "AC/DC").
 * Single-artist credits come back as `[credit]`.
 */
const FEATURING = /\s+(?:feat\.?|ft\.?|featuring|with|avec|x|vs\.?)\s+/i;
const JOINT = /\s*&\s*|\s*,\s+/;

/** Bands whose names contain "&" or ",". Lowercase; extend when a band gets split by mistake. */
export const KEEP_WHOLE = new Set([
  "above & beyond",
  "belle & sebastian",
  "chase & status",
  "crosby, stills & nash",
  "crosby, stills, nash & young",
  "earth, wind & fire",
  "emerson, lake & palmer",
  "hall & oates",
  "daryl hall & john oates",
  "iron & wine",
  "mumford & sons",
  "peter, paul and mary",
  "simon & garfunkel",
  "years & years",
  "sam & dave",
  "ashford & simpson",
  "kool & the gang",
  "lady a",
  "brooks & dunn",
  "big & rich",
  "dan + shay",
  "florence + the machine",
  "sly & the family stone",
  "echo & the bunnymen",
  "of monsters and men",
  "blood, sweat & tears",
  "chico & rita",
  "angus & julia stone",
  "she & him",
  "matt & kim",
  "christine and the queens",
]);

const startsWithThe = (part: string) => /^the\s/i.test(part);

function splitJoint(segment: string): string[] {
  if (KEEP_WHOLE.has(segment.toLowerCase())) return [segment];
  const parts = segment.split(JOINT).map((p) => p.trim());
  if (parts.length < 2 || parts.some((p) => p.length < 2 || startsWithThe(p))) return [segment];
  return parts;
}

export function splitArtistCredit(credit: string): string[] {
  const name = credit.replace(/\s+/g, " ").trim();
  if (!name || KEEP_WHOLE.has(name.toLowerCase())) return [name];
  const artists: string[] = [];
  for (const segment of name.split(FEATURING)) {
    const s = segment.trim();
    if (!s) continue;
    for (const artist of splitJoint(s)) {
      if (!artists.some((a) => a.toLowerCase() === artist.toLowerCase())) artists.push(artist);
    }
  }
  return artists.length ? artists : [name];
}

/** (credit, artist) pairs for the credits that name several artists; single-artist credits need none. */
export function creditPairs(credits: Iterable<string>): [string, string][] {
  const pairs: [string, string][] = [];
  const seen = new Set<string>();
  for (const credit of credits) {
    if (seen.has(credit)) continue;
    seen.add(credit);
    const artists = splitArtistCredit(credit);
    if (artists.length > 1) for (const a of artists) pairs.push([credit, a]);
  }
  return pairs;
}
