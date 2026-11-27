/**
 * Bilingual artist names, as YouTube Music and others send them: "헤이즈 Heize", "엄지 (UMJI)",
 * "Heize 헤이즈". They name one artist twice, in a native script and in Latin letters.
 */

/** Letters of a non-Latin script (Hangul, kana, CJK, Cyrillic, Greek, Arabic, Thai...). */
const NATIVE =
  /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Thai}]/u;
const LATIN = /\p{Script=Latin}/u;

/**
 * YouTube Music shows "Song • STAYC" or "Video • STAYC" under a title, and some scrobblers take the whole
 * line as the artist. The type label is never part of a name.
 */
const SERVICE_LABEL =
  /^(?:song|video|single|ep|album|playlist|titre|vidéo|chanson|canción|lied)\s*[•·]\s*/i;

export function withoutServiceLabel(name: string): string {
  const stripped = name.replace(SERVICE_LABEL, "").trim();
  return stripped || name;
}

/** Whether a name has letters of a non-Latin script: only such names can need renaming. */
export function hasNativeScript(name: string): boolean {
  return NATIVE.test(name);
}

export interface BilingualName {
  native: string;
  latin: string;
}

/**
 * The two halves of a bilingual name, or null when the name is not one ("Heize", "BLACKPINK",
 * "Peso Pluma & Estevan Plazola", or a mix inside a single word).
 */
export function bilingualParts(name: string): BilingualName | null {
  const trimmed = name.trim();
  // "엄지 (UMJI)" / "UMJI (엄지)"
  const paren = /^(.+?)\s*[(（]([^()（）]+)[)）]$/.exec(trimmed);
  if (paren?.[1] && paren[2]) return split(paren[1].trim(), paren[2].trim());
  // "헤이즈 Heize" / "Heize 헤이즈": a run of native words, then a run of Latin words (or the reverse).
  const words = trimmed.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(" ");
    const right = words.slice(i).join(" ");
    const pair = split(left, right);
    if (pair) return pair;
  }
  return null;
}

function split(a: string, b: string): BilingualName | null {
  const nativeOnly = (s: string) => NATIVE.test(s) && !LATIN.test(s);
  const latinOnly = (s: string) => LATIN.test(s) && !NATIVE.test(s);
  if (nativeOnly(a) && latinOnly(b)) return { native: a, latin: b };
  if (latinOnly(a) && nativeOnly(b)) return { native: b, latin: a };
  return null;
}

/**
 * The name to store for an artist credit, given the names the user's library already uses (`known`) and
 * the aliases learned before (`aliases`): an already-used form wins, else the Latin half of a bilingual
 * name. Also returns the aliases to remember so later listens under the other forms join the same artist.
 */
export function canonicalArtist(
  name: string,
  known: ReadonlySet<string>,
  aliases: ReadonlyMap<string, string>,
): { artist: string; learn: [string, string][] } {
  const aliased = aliases.get(name);
  if (aliased) return { artist: aliased, learn: [] };
  if (known.has(name)) return { artist: name, learn: [] };
  const parts = bilingualParts(name);
  if (!parts) return { artist: name, learn: [] };
  const artist = known.has(parts.latin)
    ? parts.latin
    : known.has(parts.native)
      ? parts.native
      : parts.latin;
  const learn: [string, string][] = [name, parts.native, parts.latin]
    .filter((n) => n !== artist)
    .map((n) => [n, artist]);
  return { artist, learn };
}

/**
 * Spelling-insensitive key of an artist name: "Despo' Rutti", "Despo Rutti", "despo rutti" and "DESPO’RUTTI"
 * share one. Case, width (NFKC), apostrophes and quotes, backticks, periods, hyphens and dashes, underscores
 * and spaces are ignored; everything else counts ("AC/DC", "Florence + The Machine", accents, other scripts).
 */
const SPELLING = /[\s'’‘ʼ`´".\-‐‑‒–—_]+/gu;

export function artistKey(name: string): string {
  const folded = name.normalize("NFKC").toLowerCase();
  return folded.replace(SPELLING, "") || folded.trim();
}

const nativeOnly = (s: string): boolean => NATIVE.test(s) && !LATIN.test(s);

/** Whether a name is written only in a non-Latin script ("여자친구"), with no Latin letter at all. */
export function isNativeOnly(name: string): boolean {
  return nativeOnly(name);
}

/** Whether a name has Latin letters and no letter of another script ("GFRIEND"). */
export function isLatinOnly(name: string): boolean {
  return LATIN.test(name) && !NATIVE.test(name);
}

/**
 * Whether an album title starts with an artist's native name as a whole word, the way Korean labels title
 * releases ("여자친구 The 7th Mini Album 'FEVER SEASON'" by GFRIEND). Used to tell that a native-script name
 * ("여자친구") is the artist the library knows in Latin letters. Names under two characters never match.
 */
export function albumNamedAfter(album: string, native: string): boolean {
  const n = native.trim();
  if (Array.from(n).length < 2 || !album.startsWith(n)) return false;
  const next = album.slice(n.length);
  return next === "" || /^[\s:'"‘’“”([-]/u.test(next);
}

/**
 * The (artist, track) a listen really is when a scrobbler put the title into the artist field or the artist
 * into the title, as YouTube uploads named "Artist - Title" end up:
 * - artist "GFRIEND : 유리구슬 (Glass Bead)" or "GFRIEND - 유리구슬 (Glass Bead)" with that very title → "GFRIEND";
 * - title "GFRIEND - 유리구슬 (Glass Bead)" by artist "GFRIEND" → "유리구슬 (Glass Bead)".
 * Only fires when the repeated part matches the other field, so names that merely contain " - " are kept.
 */
const JOINED = /^(.+?)(?:\s+[-–—|]\s+|\s*[:：]\s+)(.+)$/u;

export function untangleTitle(artist: string, track: string): { artist: string; track: string } {
  const a = JOINED.exec(artist.trim());
  if (a?.[1] && a[2] && artistKey(a[2]) === artistKey(track)) return { artist: a[1].trim(), track };
  const t = JOINED.exec(track.trim());
  if (t?.[1] && t[2] && artistKey(t[1]) === artistKey(artist))
    return { artist, track: t[2].trim() };
  return { artist, track };
}
