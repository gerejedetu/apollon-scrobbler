/**
 * Listening time when not every listen carries its duration (Last.fm imports never do): listens without one
 * count for the average of those that have one, or for a typical track length when too few do.
 */
export const TYPICAL_TRACK_MS = 210_000;
/** Below this many known durations, their average says little: use the typical length. */
const MIN_SAMPLE = 20;

export function estimateListeningMs(
  listenCount: number,
  knownMs: number,
  listensWithDuration: number,
): number {
  const missing = Math.max(0, listenCount - listensWithDuration);
  const average =
    listensWithDuration >= MIN_SAMPLE ? knownMs / listensWithDuration : TYPICAL_TRACK_MS;
  return Math.round(knownMs + missing * average);
}

/** For totals that only give the known sum (year in review): when it is clearly partial, estimate. */
export function estimateFromTotal(listenCount: number, totalMs: number): number {
  return listenCount > 0 && totalMs / listenCount < 60_000
    ? listenCount * TYPICAL_TRACK_MS
    : totalMs;
}
