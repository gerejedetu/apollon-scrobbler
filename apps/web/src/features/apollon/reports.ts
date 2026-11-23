import { api, type Range } from "../../api/index.ts";
import { utcOffset } from "../../lib/timezone.ts";

/** The three reports and their API ranges: the period running now, and the last complete one before it. */
export const REPORT_PERIODS = {
  semaine: { current: "this_week", previous: "week", granularity: "day" },
  mois: { current: "this_month", previous: "month", granularity: "day" },
  annee: { current: "this_year", previous: "year", granularity: "month" },
} as const satisfies Record<
  string,
  { current: Range; previous: Range; granularity: "day" | "month" }
>;

export type ReportPeriod = keyof typeof REPORT_PERIODS;
export const isReportPeriod = (v: unknown): v is ReportPeriod =>
  typeof v === "string" && v in REPORT_PERIODS;

/** A report: the running period (default) or, with `past`, the last complete one. */
export async function loadReport(userName: string, period: ReportPeriod, past: boolean) {
  const p = REPORT_PERIODS[period];
  const range: Range = past ? p.previous : p.current;
  const offset = utcOffset();
  const activity = (r: Range) =>
    api.stats.activity(userName, { range: r, granularity: p.granularity, utcOffset: offset });
  const [
    compare,
    current,
    previous,
    artists,
    albums,
    tracks,
    discoveries,
    oneShots,
    clock,
    diversity,
    diversityBefore,
    summary,
    summaryBefore,
    streaks,
    lastMonth,
    thisMonth,
  ] = await Promise.all([
    api.stats.compare(userName, { range }),
    activity(range),
    // The comparison bars exist for the running period only (its previous one is a known range).
    past ? Promise.resolve(null) : activity(p.previous),
    api.stats.top(userName, "artists", { range, limit: 5 }),
    api.stats.top(userName, "releases", { range, limit: 5 }),
    api.stats.top(userName, "recordings", { range, limit: 5 }),
    api.stats.discoveries(userName, { range, limit: 1 }),
    api.stats.oneShots(userName, { range, limit: 1 }),
    api.stats.clock(userName, { range, utcOffset: offset }),
    api.stats.diversity(userName, { range }),
    past ? Promise.resolve(null) : api.stats.diversity(userName, { range: p.previous }),
    api.stats.summary(userName, { range, utcOffset: offset }),
    api.stats.summary(userName, { range: p.previous, utcOffset: offset }),
    api.stats.streaks(userName, { utcOffset: offset }),
    api.stats.activity(userName, { range: "month", granularity: "day", utcOffset: offset }),
    api.stats.activity(userName, { range: "this_month", granularity: "day", utcOffset: offset }),
  ]);
  const hours = Array.from(
    { length: 24 },
    (_, h) => clock.hours.find((x) => x.hour === h)?.listenCount ?? 0,
  );
  const days = [...(lastMonth.days ?? []), ...(thisMonth.days ?? [])].slice(-28);
  return {
    range,
    compare,
    current,
    previous,
    artists,
    albums,
    tracks,
    discoveries,
    oneShots,
    hours,
    diversity,
    diversityBefore,
    summary,
    summaryBefore: past ? null : summaryBefore,
    streaks,
    days,
  };
}

export type ReportData = Awaited<ReturnType<typeof loadReport>>;
