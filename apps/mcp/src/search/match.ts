/**
 * Fuzzy name matching for search_library: case, accents and punctuation do not matter, and every word of the
 * query must appear. Pure, so the ranking rules are tested on their own.
 */

/** "Beyoncé — Déjà Vu!" -> "beyonce deja vu". */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * How well `query` matches `name` (higher is better), or 0 when it does not: exact name 3, name starting with
 * the query 2, every query word somewhere in the name (or its context, e.g. the artist of a track) 1.
 */
export function score(query: string, name: string, context = ""): number {
  const q = normalize(query);
  if (!q) return 0;
  const n = normalize(name);
  if (n === q) return 3;
  if (n.startsWith(q)) return 2;
  const haystack = ` ${n} ${normalize(context)} `;
  return q.split(" ").every((word) => haystack.includes(word)) ? 1 : 0;
}

export interface Candidate {
  name: string;
  context?: string;
  listenCount: number;
}

/** The candidates matching `query`, best match first, then most played. */
export function rank<T extends Candidate>(
  query: string,
  candidates: readonly T[],
  max: number,
): T[] {
  return candidates
    .map((c) => ({ c, s: score(query, c.name, c.context) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.c.listenCount - a.c.listenCount)
    .slice(0, max)
    .map((x) => x.c);
}
