/** Everything the library page shows, fetched in parallel. */
import { api, type Range } from "../../api/index.ts";
import { utcOffset } from "../../lib/timezone.ts";

export const RECENT_DAYS = 14;

export async function loadProfile(userName: string, range: Range) {
  const offset = utcOffset();
  const [summary, top, onRepeat, listens, nowPlaying, milestones, thisMonth, lastMonth, streaks] =
    await Promise.all([
      api.stats.summary(userName, { range: "all_time", utcOffset: offset }),
      api.stats.top(userName, "releases", { range, limit: 5 }),
      api.stats.onRepeat(userName, { limit: 5 }),
      api.listens.list(userName, { limit: 6 }),
      api.listens.nowPlaying(userName),
      api.stats.milestones(userName),
      api.stats.activity(userName, { range: "this_month", granularity: "day", utcOffset: offset }),
      api.stats.activity(userName, { range: "month", granularity: "day", utcOffset: offset }),
      api.stats.streaks(userName, { utcOffset: offset }),
    ]);
  // The last 14 days can straddle two months: join last month's days and this month's.
  const days = [...(lastMonth.days ?? []), ...(thisMonth.days ?? [])].slice(-RECENT_DAYS);
  return { summary, top, onRepeat, listens, nowPlaying, milestones, days, streaks };
}

export type ProfileData = Awaited<ReturnType<typeof loadProfile>>;
