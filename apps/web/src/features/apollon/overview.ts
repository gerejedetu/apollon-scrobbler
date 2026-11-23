import { api, type Range } from "../../api/index.ts";
import { utcOffset } from "../../lib/timezone.ts";
import { loadFavourites } from "../favourites/index.ts";

/** The periods of the three tops of the overview, each its own (search: artistes, albums, titres). */
export interface OverviewPeriods {
  artists: Range;
  albums: Range;
  tracks: Range;
}

/** Everything the overview (Aperçu) shows, fetched in parallel. */
export async function loadOverview(userName: string, periods: OverviewPeriods) {
  const offset = utcOffset();
  const [
    summary,
    listens,
    nowPlaying,
    favourites,
    discoveries,
    artists,
    albums,
    tracks,
    streaks,
    lastMonth,
    thisMonth,
    thisWeek,
    thisYear,
    onRepeat,
  ] = await Promise.all([
    api.stats.summary(userName, { range: "all_time", utcOffset: offset }),
    api.listens.list(userName, { limit: 10 }),
    api.listens.nowPlaying(userName),
    loadFavourites(userName),
    api.stats.discoveries(userName, { range: "this_week", limit: 1 }).catch(() => null),
    api.stats.top(userName, "artists", { range: periods.artists, limit: 5 }),
    api.stats.top(userName, "releases", { range: periods.albums, limit: 5 }),
    api.stats.top(userName, "recordings", { range: periods.tracks, limit: 10 }),
    api.stats.streaks(userName, { utcOffset: offset }),
    api.stats.activity(userName, { range: "month", granularity: "day", utcOffset: offset }),
    api.stats.activity(userName, { range: "this_month", granularity: "day", utcOffset: offset }),
    api.stats.activity(userName, { range: "this_week", granularity: "day", utcOffset: offset }),
    api.stats.activity(userName, { range: "this_year", granularity: "month", utcOffset: offset }),
    api.stats.onRepeat(userName, { limit: 4 }),
  ]);
  // The streak strip shows the last 28 days, which can straddle two months.
  const days = [...(lastMonth.days ?? []), ...(thisMonth.days ?? [])].slice(-28);
  return {
    summary,
    listens,
    nowPlaying: nowPlaying.nowPlaying,
    favourites,
    discovery: discoveries?.artists.items[0] ?? null,
    artists,
    albums,
    tracks,
    streaks,
    days,
    reports: {
      week: {
        from: thisWeek.from,
        to: thisWeek.to,
        bars: (thisWeek.days ?? []).map((d) => d.listenCount),
      },
      month: { from: thisMonth.from, bars: (thisMonth.days ?? []).map((d) => d.listenCount) },
      year: { from: thisYear.from, bars: (thisYear.periods ?? []).map((p) => p.listenCount) },
    },
    onRepeat,
  };
}

export type OverviewData = Awaited<ReturnType<typeof loadOverview>>;
