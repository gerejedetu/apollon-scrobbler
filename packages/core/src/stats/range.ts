/**
 * ListenBrainz stats ranges, computed in UTC.
 * `this_*` = the current period up to now; `week`, `month`, `quarter`, `half_yearly`, `year` = the last complete period.
 */
import type { StatsRange, TimeWindow } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";

export const STATS_RANGES: readonly StatsRange[] = [
  "this_week",
  "this_month",
  "this_year",
  "week",
  "month",
  "quarter",
  "half_yearly",
  "year",
  "all_time",
];

export function parseRange(raw: string | undefined): StatsRange {
  const range = raw ?? "all_time";
  if (!STATS_RANGES.includes(range as StatsRange)) {
    throw ApiError.badRequest(`Invalid range: ${range}. Valid ranges: ${STATS_RANGES.join(", ")}.`);
  }
  return range as StatsRange;
}

const sec = (ms: number) => Math.floor(ms / 1000);
const utc = (y: number, m: number, d = 1) => Date.UTC(y, m, d);

/** Start (ms) of the ISO week (Monday 00:00 UTC) containing `ms`. */
function weekStart(ms: number): number {
  const d = new Date(ms);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return utc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

export function rangeWindow(range: StatsRange, now: number): TimeWindow {
  const nowMs = now * 1000;
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const until = (endMs: number) => sec(endMs) - 1;

  switch (range) {
    case "all_time":
      return { fromTs: 0, toTs: now };
    case "this_week":
      return { fromTs: sec(weekStart(nowMs)), toTs: now };
    case "this_month":
      return { fromTs: sec(utc(y, m)), toTs: now };
    case "this_year":
      return { fromTs: sec(utc(y, 0)), toTs: now };
    case "week": {
      const end = weekStart(nowMs);
      return { fromTs: sec(end - 7 * 86_400_000), toTs: until(end) };
    }
    case "month":
      return { fromTs: sec(utc(y, m - 1)), toTs: until(utc(y, m)) };
    case "quarter": {
      const q = Math.floor(m / 3) * 3;
      return { fromTs: sec(utc(y, q - 3)), toTs: until(utc(y, q)) };
    }
    case "half_yearly": {
      const h = m < 6 ? 0 : 6;
      return { fromTs: sec(utc(y, h - 6)), toTs: until(utc(y, h)) };
    }
    case "year":
      return { fromTs: sec(utc(y - 1, 0)), toTs: until(utc(y, 0)) };
  }
}
