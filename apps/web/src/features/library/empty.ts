// Not ../../api/index.ts: that pulls in the Worker transport, and this file is unit tested.
import { isNotFound } from "@scrobbler/client";
import type { AlbumPage, ArtistPage, Range, Timeline, TrackPage } from "@scrobbler/client";

/**
 * The API answers 404 for a track, album or artist with no listen in the range (a track only playing now,
 * a period without it). Those pages show "0 listens" instead of "Nothing here"; other errors still throw.
 */
export async function orEmpty<T>(request: Promise<T>, empty: () => T): Promise<T> {
  try {
    return await request;
  } catch (e) {
    if (isNotFound(e)) return empty();
    throw e;
  }
}

const span = (range: Range) => ({ range, from: 0, to: 0 });

export const emptyTrack = (artist: string, track: string, range: Range): TrackPage => ({
  ...span(range),
  artist,
  track,
  listenCount: 0,
  firstListenedAt: null,
  lastListenedAt: null,
  byMonth: [],
});

export const emptyAlbum = (artist: string, album: string, range: Range): AlbumPage => ({
  ...span(range),
  artist,
  album,
  listenCount: 0,
  firstListenedAt: null,
  lastListenedAt: null,
  tracks: [],
});

export const emptyArtist = (artist: string, range: Range): ArtistPage => ({
  ...span(range),
  artist,
  listenCount: 0,
  trackCount: 0,
  albumCount: 0,
  firstListenedAt: null,
  lastListenedAt: null,
  albums: [],
  topTracks: [],
});

export const emptyTimeline = (artist: string, granularity: Timeline["granularity"]): Timeline => ({
  ...span("all_time"),
  artist,
  granularity,
  periods: [],
});
