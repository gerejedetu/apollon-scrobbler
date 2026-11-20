/** Everything the stats page shows for a range, fetched in parallel. */
import { api, type Entity, type Range } from "../../api/index.ts";
import { utcOffset } from "../../lib/timezone.ts";

export const TREND_ENTITIES = [
  "artists",
  "releases",
  "recordings",
] as const satisfies readonly Entity[];

export async function loadStats(userName: string, range: Range) {
  const offset = utcOffset();
  // Comparisons and trends need a previous period: none for all_time.
  const bounded = range !== "all_time";
  const trends = (entity: Entity) =>
    bounded ? api.stats.trends(userName, { range, entity, limit: 4 }) : Promise.resolve(null);
  const [
    summary,
    compare,
    activity,
    clock,
    trendArtists,
    trendAlbums,
    trendTracks,
    streaks,
    recentThis,
    recentPrev,
    diversity,
    sessions,
    oneShots,
    discoveries,
    forgotten,
    onThisDay,
    topArtist,
  ] = await Promise.all([
    api.stats.summary(userName, { range, utcOffset: offset }),
    bounded ? api.stats.compare(userName, { range }) : Promise.resolve(null),
    api.stats.activity(userName, { range, granularity: "day", utcOffset: offset }),
    api.stats.clock(userName, { range, utcOffset: offset }),
    trends("artists"),
    trends("releases"),
    trends("recordings"),
    api.stats.streaks(userName, { utcOffset: offset }),
    api.stats.activity(userName, { range: "this_month", granularity: "day", utcOffset: offset }),
    api.stats.activity(userName, { range: "month", granularity: "day", utcOffset: offset }),
    api.stats.diversity(userName, { range }),
    api.stats.sessions(userName, { range }),
    api.stats.oneShots(userName, { range, limit: 1 }),
    api.stats.discoveries(userName, { range, limit: 5 }),
    api.stats.forgotten(userName, { months: 6, entity: "releases", limit: 4 }),
    api.stats.onThisDay(userName, { utcOffset: offset, limit: 3 }),
    api.stats.top(userName, "artists", { range, limit: 1 }),
  ]);
  const last30 = [...(recentPrev.days ?? []), ...(recentThis.days ?? [])].slice(-30);
  return {
    summary,
    compare,
    activity,
    clock,
    trends:
      trendArtists && trendAlbums && trendTracks
        ? { artists: trendArtists, releases: trendAlbums, recordings: trendTracks }
        : null,
    streaks,
    last30,
    diversity,
    sessions,
    oneShots,
    discoveries,
    forgotten,
    onThisDay,
    topArtist: topArtist.items[0]?.artist,
  };
}

export type StatsData = Awaited<ReturnType<typeof loadStats>>;
