import type { StatsEntity, StatsResult, User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { Cache, Clock, StatsRepository } from "../ports/index.ts";
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
  if (!/^\d+$/.test(raw)) throw ApiError.badRequest(`Invalid ${name}: must be a non-negative integer.`);
  return Number(raw);
}

export class StatsService {
  constructor(
    private readonly stats: StatsRepository,
    private readonly clock: Clock,
    private readonly cache?: Cache,
  ) {}

  async top(user: User, entity: StatsEntity, params: StatsParams): Promise<StatsResult> {
    const range = parseRange(params.range);
    const limit = Math.min(parseNonNegative("count", params.count, DEFAULT_COUNT), MAX_COUNT);
    const offset = parseNonNegative("offset", params.offset, 0);
    const now = this.clock();
    const window = rangeWindow(range, now);

    // Open-ended windows (this_*, all_time) end "now": key on their start only, the listen count covers new data.
    const key = `stats:v1:${user.id}:${user.listenCount}:${entity}:${range}:${window.fromTs}:${limit}:${offset}`;
    const cached = await this.cache?.get<StatsResult>(key);
    if (cached) return cached;

    const top = await this.stats.top({ userId: user.id, entity, window, limit, offset });
    const result: StatsResult = { ...top, entity, range, window, lastUpdated: now };
    await this.cache?.set(key, result, STATS_CACHE_TTL);
    return result;
  }
}
