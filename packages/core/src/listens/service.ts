import type { ApiListen, TrackMetadata, User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type {
  ArtistRepository,
  Clock,
  ListenRepository,
  PlayingNowRepository,
} from "../ports/index.ts";
import { bilingualParts, canonicalArtist, hasNativeScript } from "../artists/names.ts";
import {
  canonicalAlbum,
  editionBase,
  hasEditionMarker,
  withoutStoreSuffixes,
} from "../albums/names.ts";
import { LISTEN_LIMITS } from "./limits.ts";
import { toApiListen, toNewListen } from "./mapping.ts";
import { validateSubmission } from "./validate.ts";

export interface ListenListParams {
  min_ts?: string | undefined;
  max_ts?: string | undefined;
  count?: string | undefined;
}

export interface ListenListResult {
  count: number;
  listens: ApiListen[];
  latest_listen_ts: number | null;
  oldest_listen_ts: number | null;
}

export interface SubmitResult {
  accepted: number;
  inserted: number;
}

function parseIntParam(name: string, raw: string | undefined): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  if (!/^\d+$/.test(raw))
    throw ApiError.badRequest(`Invalid ${name}: must be a non-negative integer.`);
  return Number(raw);
}

function playingNowTtl(meta: TrackMetadata): number {
  const info = meta.additional_info ?? {};
  const seconds =
    typeof info.duration_ms === "number"
      ? Math.ceil(info.duration_ms / 1000)
      : typeof info.duration === "number"
        ? info.duration
        : undefined;
  if (seconds === undefined) return LISTEN_LIMITS.playingNowDefaultTtl;
  return Math.min(seconds, LISTEN_LIMITS.playingNowMaxTtl);
}

export class ListenService {
  constructor(
    private readonly listens: ListenRepository,
    private readonly playingNow: PlayingNowRepository,
    private readonly clock: Clock,
    private readonly artists?: ArtistRepository,
  ) {}

  /**
   * One name per artist: "헤이즈 Heize" joins the "Heize" the library already has (or becomes "Heize"),
   * and the forms seen are remembered so that "헤이즈" alone joins it later too.
   */
  private async canonicalNames(user: User, names: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    // Latin-only names are stored as sent: no lookup at all, so most imports stay one round trip.
    const distinct = [...new Set(names)].filter(hasNativeScript);
    if (!this.artists || distinct.length === 0) return out;
    const candidates = new Set<string>(distinct);
    for (const n of distinct) {
      const parts = bilingualParts(n);
      if (parts) candidates.add(parts.latin).add(parts.native);
    }
    const [aliases, known] = await Promise.all([
      this.artists.aliases(distinct),
      this.artists.known(user.id, [...candidates]),
    ]);
    const learn: [string, string][] = [];
    for (const n of distinct) {
      const result = canonicalArtist(n, known, aliases);
      if (result.artist !== n) out.set(n, result.artist);
      learn.push(...result.learn);
    }
    if (learn.length) await this.artists.learnAliases(learn);
    return out;
  }

  /**
   * One name per album: "Midnights [Clean]" is stored as "Midnights", "Love, Yerin - EP" as "Love, Yerin", and "X (Deluxe)" joins "X" when the
   * library already has it. Only names carrying such a marker cost a lookup.
   */
  private async canonicalAlbums(
    user: User,
    listens: { trackMetadata: TrackMetadata }[],
  ): Promise<void> {
    const marked = listens.filter(
      (l) => l.trackMetadata.release_name && hasEditionMarker(l.trackMetadata.release_name),
    );
    if (marked.length === 0) return;
    const pairs = new Map<string, [string, string]>();
    for (const { trackMetadata: m } of marked) {
      const clean = withoutStoreSuffixes(m.release_name!);
      for (const album of [clean, editionBase(clean)])
        pairs.set(`${m.artist_name}\u0000${album}`, [m.artist_name, album]);
    }
    const known = this.artists
      ? await this.artists.knownAlbums(user.id, [...pairs.values()])
      : new Set<string>();
    for (const l of marked) {
      const m = l.trackMetadata;
      const prefix = `${m.artist_name}\u0000`;
      const ofArtist = new Set(
        [...known].filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)),
      );
      const album = canonicalAlbum(m.release_name!, ofArtist);
      if (album !== m.release_name) l.trackMetadata = { ...m, release_name: album };
    }
  }

  async submit(user: User, body: unknown): Promise<SubmitResult> {
    const submission = validateSubmission(body);
    const now = this.clock();
    const renamed = await this.canonicalNames(
      user,
      submission.listens.map((l) => l.trackMetadata.artist_name),
    );
    for (const l of submission.listens) {
      const artist = renamed.get(l.trackMetadata.artist_name);
      if (artist) l.trackMetadata = { ...l.trackMetadata, artist_name: artist };
    }
    await this.canonicalAlbums(user, submission.listens);

    if (submission.listenType === "playing_now") {
      const [listen] = submission.listens;
      if (listen) {
        await this.playingNow.set({
          userId: user.id,
          trackMetadata: listen.trackMetadata,
          expiresAt: now + playingNowTtl(listen.trackMetadata),
        });
      }
      return { accepted: 1, inserted: 0 };
    }

    const rows = await Promise.all(
      submission.listens.map((l) => toNewListen(l.listenedAt ?? now, l.trackMetadata)),
    );
    const inserted = await this.listens.insertMany(user.id, rows, now);
    return { accepted: rows.length, inserted };
  }

  async list(user: User, params: ListenListParams): Promise<ListenListResult> {
    const minTs = parseIntParam("min_ts", params.min_ts);
    const maxTs = parseIntParam("max_ts", params.max_ts);
    const count = parseIntParam("count", params.count) ?? LISTEN_LIMITS.defaultItemsPerGet;
    if (minTs !== undefined && maxTs !== undefined && minTs >= maxTs) {
      throw ApiError.badRequest("min_ts should be less than max_ts.");
    }
    const limit = Math.min(Math.max(count, 0), LISTEN_LIMITS.maxItemsPerGet);
    const page = await this.listens.page({ userId: user.id, minTs, maxTs, limit });
    const listens = page.listens.map((l) => toApiListen(l, user.name));
    return {
      count: listens.length,
      listens,
      latest_listen_ts: page.latestListenTs,
      oldest_listen_ts: page.oldestListenTs,
    };
  }

  async current(user: User): Promise<TrackMetadata | null> {
    const entry = await this.playingNow.get(user.id, this.clock());
    return entry?.trackMetadata ?? null;
  }

  async delete(user: User, body: unknown): Promise<void> {
    if (typeof body !== "object" || body === null)
      throw ApiError.badRequest("Invalid JSON document submitted.");
    const { listened_at, recording_msid } = body as Record<string, unknown>;
    if (typeof listened_at !== "number" || !Number.isInteger(listened_at)) {
      throw ApiError.badRequest("JSON document must contain the key listened_at as an integer.");
    }
    if (typeof recording_msid !== "string" || recording_msid.length === 0) {
      throw ApiError.badRequest("JSON document must contain the key recording_msid.");
    }
    await this.listens.delete(user.id, listened_at, recording_msid);
  }
}
