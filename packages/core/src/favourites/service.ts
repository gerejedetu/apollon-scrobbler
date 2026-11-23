/**
 * Loved tracks and the current obsession, as on Last.fm: one click on a listen. Identified by artist and
 * title, so loving a track loves every listen of it.
 */
import type { FavouriteTrack, User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { Clock, FavouriteRepository } from "../ports/index.ts";

const MAX_NAME = 512;
const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_LOVED_PAGE = 100;

/** The track part of a request body: `{ artist, track, album?, mbids?: { recording?, release? } }`. */
export interface TrackRef {
  artist: unknown;
  track: unknown;
  album?: unknown;
  mbids?: unknown;
}

function name(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim())
    throw ApiError.badRequest(`${field} is required.`);
  const v = value.trim();
  if (v.length > MAX_NAME) throw ApiError.badRequest(`${field} is too long.`);
  return v;
}

const mbid = (value: unknown) =>
  typeof value === "string" && MBID.test(value) ? value.toLowerCase() : null;

export class FavouriteService {
  constructor(
    private readonly favourites: FavouriteRepository,
    private readonly clock: Clock,
  ) {}

  private toFavourite(ref: TrackRef): FavouriteTrack {
    const mbids = (typeof ref.mbids === "object" && ref.mbids !== null ? ref.mbids : {}) as Record<
      string,
      unknown
    >;
    const album =
      typeof ref.album === "string" && ref.album.trim()
        ? ref.album.trim().slice(0, MAX_NAME)
        : null;
    return {
      artistName: name(ref.artist, "artist"),
      trackName: name(ref.track, "track"),
      releaseName: album,
      recordingMbid: mbid(mbids.recording),
      releaseMbid: mbid(mbids.release),
      at: this.clock(),
    };
  }

  async love(user: User, ref: TrackRef): Promise<void> {
    return this.favourites.love(user.id, this.toFavourite(ref));
  }

  async unlove(user: User, artist: unknown, track: unknown): Promise<void> {
    return this.favourites.unlove(user.id, name(artist, "artist"), name(track, "track"));
  }

  loved(user: User, query: { limit?: unknown; offset?: unknown } = {}) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50) || 50, 1), MAX_LOVED_PAGE);
    const offset = Math.max(Number(query.offset ?? 0) || 0, 0);
    return this.favourites.loved(user.id, limit, offset);
  }

  async setObsession(user: User, ref: TrackRef): Promise<void> {
    const t = this.toFavourite(ref);
    return this.favourites.setObsession(user.id, t, t.at);
  }

  clearObsession(user: User): Promise<void> {
    return this.favourites.setObsession(user.id, null, this.clock());
  }

  obsessionHistory(user: User, query: { limit?: unknown; offset?: unknown } = {}) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50) || 50, 1), MAX_LOVED_PAGE);
    const offset = Math.max(Number(query.offset ?? 0) || 0, 0);
    return this.favourites.obsessionHistory(user.id, limit, offset, this.clock());
  }

  async deleteObsessionPeriod(user: User, id: unknown): Promise<void> {
    const n = Number(id);
    if (!Number.isInteger(n) || n < 1) throw ApiError.badRequest("Invalid obsession id.");
    if (!(await this.favourites.deleteObsessionPeriod(user.id, n))) {
      throw ApiError.notFound("No such obsession in your history.");
    }
  }

  obsession(user: User): Promise<FavouriteTrack | null> {
    return this.favourites.obsession(user.id);
  }
}
