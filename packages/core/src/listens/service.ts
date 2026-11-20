import type { ApiListen, TrackMetadata, User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { Clock, ListenRepository, PlayingNowRepository } from "../ports/index.ts";
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
  if (!/^\d+$/.test(raw)) throw ApiError.badRequest(`Invalid ${name}: must be a non-negative integer.`);
  return Number(raw);
}

function playingNowTtl(meta: TrackMetadata): number {
  const info = meta.additional_info ?? {};
  const seconds =
    typeof info.duration_ms === "number" ? Math.ceil(info.duration_ms / 1000) : typeof info.duration === "number" ? info.duration : undefined;
  if (seconds === undefined) return LISTEN_LIMITS.playingNowDefaultTtl;
  return Math.min(seconds, LISTEN_LIMITS.playingNowMaxTtl);
}

export class ListenService {
  constructor(
    private readonly listens: ListenRepository,
    private readonly playingNow: PlayingNowRepository,
    private readonly clock: Clock,
  ) {}

  async submit(user: User, body: unknown): Promise<SubmitResult> {
    const submission = validateSubmission(body);
    const now = this.clock();

    if (submission.listenType === "playing_now") {
      const [listen] = submission.listens;
      if (listen) {
        await this.playingNow.set({ userId: user.id, trackMetadata: listen.trackMetadata, expiresAt: now + playingNowTtl(listen.trackMetadata) });
      }
      return { accepted: 1, inserted: 0 };
    }

    const rows = await Promise.all(submission.listens.map((l) => toNewListen(l.listenedAt ?? now, l.trackMetadata)));
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
    return { count: listens.length, listens, latest_listen_ts: page.latestListenTs, oldest_listen_ts: page.oldestListenTs };
  }

  async current(user: User): Promise<TrackMetadata | null> {
    const entry = await this.playingNow.get(user.id, this.clock());
    return entry?.trackMetadata ?? null;
  }

  async delete(user: User, body: unknown): Promise<void> {
    if (typeof body !== "object" || body === null) throw ApiError.badRequest("Invalid JSON document submitted.");
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
