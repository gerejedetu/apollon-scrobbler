import type {
  ActivityDay,
  ArtistDetail,
  StatsEntity,
  StatsRange,
  StatsResult,
  Summary,
  TimeWindow,
  User,
} from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { Cache, Clock, StatsRepository } from "../ports/index.ts";
import { DEFAULT_CACHE_MIN_LISTENS } from "../cache/policy.ts";
import { parseRange, rangeWindow } from "./range.ts";

const DEFAULT_COUNT = 25;
const MAX_COUNT = 100;
/** Cached results are keyed by the user's listen count, so new listens invalidate them; the TTL only bounds staleness of deletions + window edges. */
const STATS_CACHE_TTL = 6 * 60 * 60;

export interface StatsParams {
  range?: string | undefined;
  count?: string | undefined;
  offset?: string | undefined;
}

function parseNonNegative(name: string, raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  if (!/^\d+$/.test(raw))
    throw ApiError.badRequest(`Invalid ${name}: must be a non-negative integer.`);
  return Number(raw);
}

/** utcOffset is in minutes, like JavaScript's (but with the sign people expect: Paris in winter = 60). */
function parseUtcOffset(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 0;
  if (!/^-?\d+$/.test(raw) || Number(raw) < -720 || Number(raw) > 840) {
    throw ApiError.badRequest("Invalid utcOffset: minutes between -720 and 840.");
  }
  return Number(raw) * 60;
}

function dayToDate(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

interface Windowed<T> {
  range: StatsRange;
  window: TimeWindow;
  lastUpdated: number;
  data: T;
}

export class StatsService {
  constructor(
    private readonly stats: StatsRepository,
    private readonly clock: Clock,
    private readonly cache?: Cache,
    private readonly cacheMinListens = DEFAULT_CACHE_MIN_LISTENS,
  ) {}

  /** The cache to use for this user, or undefined when recomputing is cheaper (see cache/policy.ts). */
  private cacheFor(user: User): Cache | undefined {
    return user.listenCount >= this.cacheMinListens ? this.cache : undefined;
  }

  async top(user: User, entity: StatsEntity, params: StatsParams): Promise<StatsResult> {
    const range = parseRange(params.range);
    const limit = Math.min(parseNonNegative("count", params.count, DEFAULT_COUNT), MAX_COUNT);
    const offset = parseNonNegative("offset", params.offset, 0);
    const now = this.clock();
    const window = rangeWindow(range, now);

    // Open-ended windows (this_*, all_time) end "now": key on their start only, the listen count covers new data.
    const key = `stats:v2:${user.id}:${user.listenCount}:${entity}:${range}:${window.fromTs}:${limit}:${offset}`;
    const cached = await this.cacheFor(user)?.get<StatsResult>(key);
    if (cached) return cached;

    const top = await this.stats.top({ userId: user.id, entity, window, limit, offset });
    const result: StatsResult = { ...top, entity, range, window, lastUpdated: now };
    await this.cacheFor(user)?.set(key, result, STATS_CACHE_TTL);
    return result;
  }

  /**
   * Computes `compute(window)` once per (user, listen count, kind, window start): new listens change the
   * listen count and so the key, which is how cached stats stay fresh without explicit invalidation.
   */
  private async windowed<T>(
    user: User,
    kind: string,
    rawRange: string | undefined,
    compute: (window: TimeWindow) => Promise<T>,
  ): Promise<Windowed<T>> {
    const range = parseRange(rawRange);
    const now = this.clock();
    const window = rangeWindow(range, now);
    const key = `stats:v2:${user.id}:${user.listenCount}:${kind}:${range}:${window.fromTs}`;
    const cached = await this.cacheFor(user)?.get<Windowed<T>>(key);
    if (cached) return cached;
    const result: Windowed<T> = { range, window, lastUpdated: now, data: await compute(window) };
    // Not-found results are not cached: random names must not turn into cache writes.
    if (result.data !== null) await this.cacheFor(user)?.set(key, result, STATS_CACHE_TTL);
    return result;
  }

  /** Listens per local day, for a chart. Days without listens are included as 0 inside the window. */
  async activity(
    user: User,
    params: { range?: string | undefined; utcOffset?: string | undefined },
  ): Promise<Windowed<ActivityDay[]>> {
    const offset = parseUtcOffset(params.utcOffset);
    return this.windowed(user, `activity:${offset}`, params.range, async (window) => {
      const rows = await this.stats.activity({ userId: user.id, window, utcOffsetSeconds: offset });
      if (rows.length === 0) return [];
      const counts = new Map(rows.map((r) => [r.day, r.listenCount]));
      const first =
        window.fromTs === 0 ? (rows[0]?.day ?? 0) : Math.floor((window.fromTs + offset) / 86_400);
      const last = Math.floor((window.toTs + offset) / 86_400);
      const days: ActivityDay[] = [];
      for (let d = first; d <= last; d++)
        days.push({ date: dayToDate(d), listenCount: counts.get(d) ?? 0 });
      return days;
    });
  }

  async summary(user: User, params: { range?: string | undefined }): Promise<Windowed<Summary>> {
    return this.windowed(user, "summary", params.range, (window) =>
      this.stats.summary(user.id, window),
    );
  }

  async artist(
    user: User,
    artistName: string,
    params: { range?: string | undefined; count?: string | undefined },
  ): Promise<Windowed<ArtistDetail>> {
    const limit = Math.min(parseNonNegative("count", params.count, DEFAULT_COUNT), MAX_COUNT);
    const result = await this.windowed(
      user,
      `artist:${limit}:${artistName}`,
      params.range,
      (window) => this.stats.artist({ userId: user.id, artistName, window, limit }),
    );
    if (!result.data) throw ApiError.notFound(`No listens of ${artistName} for this range.`);
    return result as Windowed<ArtistDetail>;
  }
}
