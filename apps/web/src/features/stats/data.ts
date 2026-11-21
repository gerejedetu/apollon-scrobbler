/** Everything the stats page shows for a range, fetched in parallel. */
import { api, type Range } from "../../api/index.ts";
import { utcOffset } from "../../lib/timezone.ts";

export async function loadStats(userName: string, range: Range) {
  const offset = utcOffset();
  // Comparisons need a previous period: none for all_time.
  const compare =
    range !== "all_time" ? api.stats.compare(userName, { range }) : Promise.resolve(null);
  const [summary, before, activity, clock, artists, tracks, albums, streaks, discoveries] =
    await Promise.all([
      api.stats.summary(userName, { range, utcOffset: offset }),
      compare,
      api.stats.activity(userName, { range, granularity: "day", utcOffset: offset }),
      api.stats.clock(userName, { range, utcOffset: offset }),
      api.stats.top(userName, "artists", { range, limit: 5 }),
      api.stats.top(userName, "recordings", { range, limit: 5 }),
      api.stats.top(userName, "releases", { range, limit: 5 }),
      api.stats.streaks(userName, { utcOffset: offset }),
      api.stats.discoveries(userName, { range, limit: 3 }),
    ]);
  return {
    summary,
    compare: before,
    activity,
    clock,
    artists,
    tracks,
    albums,
    streaks,
    discoveries,
  };
}

export type StatsData = Awaited<ReturnType<typeof loadStats>>;
