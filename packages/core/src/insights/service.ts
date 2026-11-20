/**
 * Extended statistics for one user. Every result is cached under a key that includes the user's listen
 * count, so new listens make fresh results without explicit invalidation (see StatsService).
 */
import type { EntityKey, StatsRange, TimeWindow, User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { Cache, Clock, InsightsRepository, StatsRepository } from "../ports/index.ts";
import { DEFAULT_CACHE_MIN_LISTENS } from "../cache/policy.ts";
import { parseRange, rangeWindow } from "../stats/range.ts";
import * as p from "./params.ts";
import { DAY, dayToDate, percentChange, type Raw, weekToDate } from "./params.ts";

const CACHE_TTL = 6 * 60 * 60;
const MILESTONES = [
  1, 10, 100, 250, 500, 1000, 2500, 5000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000,
  1_000_000,
];
const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Params = Record<string, Raw>;

interface Ranged {
  range: StatsRange;
  from: number;
  to: number;
}

function previousWindow(w: TimeWindow): TimeWindow {
  const length = w.toTs - w.fromTs + 1;
  return { fromTs: w.fromTs - length, toTs: w.fromTs - 1 };
}

function bucketLabel(bucket: "day" | "week" | "month" | "year", key: number | string): string {
  if (bucket === "day") return dayToDate(key as number);
  if (bucket === "week") return weekToDate(key as number);
  return String(key);
}

function requireText(name: string, value: string | undefined): string {
  if (!value || !value.trim()) throw ApiError.badRequest(`${name} is required.`);
  return value;
}

export class InsightsService {
  constructor(
    private readonly insights: InsightsRepository,
    private readonly stats: StatsRepository,
    private readonly clock: Clock,
    private readonly cache?: Cache,
    private readonly cacheMinListens = DEFAULT_CACHE_MIN_LISTENS,
  ) {}

  private async cached<T>(
    user: User,
    name: string,
    params: unknown,
    compute: () => Promise<T>,
    /** Set to false for results new listens rarely change (milestones), so they are not recomputed on every listen. */
    byListenCount = true,
  ): Promise<T> {
    // Small histories are cheaper to recompute than to cache (see cache/policy.ts).
    if (!this.cache || user.listenCount < this.cacheMinListens) return compute();
    const version = byListenCount ? user.listenCount : "any";
    const key = `insights:v1:${user.id}:${version}:${name}:${JSON.stringify(params)}`;
    const hit = await this.cache.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
    const value = await compute();
    // Not-found results are not cached: random names must not turn into cache writes.
    if (value !== null) await this.cache.set(key, value, CACHE_TTL);
    return value;
  }

  private ranged(raw: Raw): Ranged & { window: TimeWindow } {
    const range = parseRange(raw);
    const window = rangeWindow(range, this.clock());
    return { range, window, from: window.fromTs, to: window.toTs };
  }

  private meta({ range, from, to }: Ranged) {
    return { range, from, to, lastUpdated: this.clock() };
  }

  /** 1-3: listens per hour, per weekday, and the weekday x hour heatmap, from a single query. */
  async listeningClock(user: User, q: Params) {
    const r = this.ranged(q.range);
    const offset = p.utcOffset(q.utcOffset);
    return this.cached(user, "clock", [r.from, offset], async () => {
      const rows = await this.insights.histogram({
        userId: user.id,
        window: r.window,
        utcOffsetSeconds: offset,
        bucket: "hour_weekday",
      });
      const heatmap = WEEKDAYS.map(() => Array.from({ length: 24 }, () => 0));
      for (const row of rows) heatmap[row.key as number]![row.hour ?? 0] = row.listenCount;
      const hours = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        listenCount: heatmap.reduce((n, day) => n + day[h]!, 0),
      }));
      const weekdays = WEEKDAYS.map((name, d) => ({
        weekday: name,
        listenCount: heatmap[d]!.reduce((a, b) => a + b, 0),
      }));
      return { ...this.meta(r), utcOffset: offset / 60, hours, weekdays, heatmap };
    });
  }

  /** 4: listens per week, month or year (per day is StatsService.activity). */
  async activity(user: User, q: Params) {
    const r = this.ranged(q.range);
    const offset = p.utcOffset(q.utcOffset);
    const granularity = p.oneOf(
      "granularity",
      q.granularity,
      ["week", "month", "year"] as const,
      "month",
    );
    return this.cached(user, "activity", [r.from, offset, granularity], async () => {
      const rows = await this.insights.timeline({
        userId: user.id,
        window: r.window,
        utcOffsetSeconds: offset,
        bucket: granularity,
      });
      return {
        ...this.meta(r),
        granularity,
        periods: rows.map((row) => ({
          period: bucketLabel(granularity, row.key),
          listenCount: row.listenCount,
        })),
      };
    });
  }

  /** 5: days in a row with at least one listen: the current streak and the record. */
  async streaks(user: User, q: Params) {
    const offset = p.utcOffset(q.utcOffset);
    return this.cached(user, "streaks", [offset], async () => {
      const days = await this.insights.listeningDays({
        userId: user.id,
        window: { fromTs: 0, toTs: this.clock() },
        utcOffsetSeconds: offset,
      });
      let best = { days: 0, from: 0, to: 0 };
      let start = 0;
      for (let i = 0; i < days.length; i++) {
        if (i > 0 && days[i]! !== days[i - 1]! + 1) start = i;
        const length = i - start + 1;
        if (length > best.days) best = { days: length, from: days[start]!, to: days[i]! };
      }
      const today = Math.floor((this.clock() + offset) / DAY);
      const last = days.at(-1);
      let current = 0;
      // A streak is still alive if the last listening day is today or yesterday.
      if (last !== undefined && today - last <= 1) {
        current = 1;
        for (let i = days.length - 1; i > 0 && days[i]! === days[i - 1]! + 1; i--) current++;
      }
      return {
        utcOffset: offset / 60,
        activeDays: days.length,
        current: { days: current, since: current ? dayToDate(last! - current + 1) : null },
        longest: best.days
          ? { days: best.days, from: dayToDate(best.from), to: dayToDate(best.to) }
          : null,
        lastUpdated: this.clock(),
      };
    });
  }

  /** 6-8 (+ totals): busiest day, total listening time, average per day. */
  async overview(user: User, q: Params) {
    const r = this.ranged(q.range);
    const offset = p.utcOffset(q.utcOffset);
    return this.cached(user, "overview", [r.from, offset], async () => {
      const query = { userId: user.id, window: r.window, utcOffsetSeconds: offset };
      const [summary, days, duration] = await Promise.all([
        this.stats.summary(user.id, r.window),
        this.insights.histogram({ ...query, bucket: "day" }),
        this.insights.duration(query),
      ]);
      const busiest = days.reduce<(typeof days)[number] | null>(
        (best, d) => (!best || d.listenCount > best.listenCount ? d : best),
        null,
      );
      const firstDay =
        r.from === 0 ? (days[0]?.key as number | undefined) : Math.floor((r.from + offset) / DAY);
      const lastDay = Math.floor((r.to + offset) / DAY);
      const spanDays = firstDay === undefined ? 0 : lastDay - firstDay + 1;
      return {
        ...this.meta(r),
        ...summary,
        activeDays: days.length,
        averagePerDay: spanDays ? Math.round((summary.listenCount / spanDays) * 10) / 10 : 0,
        averagePerActiveDay: days.length
          ? Math.round((summary.listenCount / days.length) * 10) / 10
          : 0,
        busiestDay: busiest
          ? { date: dayToDate(busiest.key as number), listenCount: busiest.listenCount }
          : null,
        listeningTime: {
          totalMs: duration.totalMs,
          // Clients do not always send a duration: this says how much of the total is measured.
          listensWithDuration: duration.listensWithDuration,
        },
      };
    });
  }

  /** 9-10: artists and tracks heard for the very first time during the range. */
  async discoveries(user: User, q: Params) {
    const r = this.ranged(q.range);
    const n = p.limit(q.limit);
    return this.cached(user, "discoveries", [r.from, n], async () => {
      const query = { userId: user.id, window: r.window, utcOffsetSeconds: 0, limit: n };
      const [artists, tracks] = await Promise.all([
        this.insights.discoveries({ ...query, entity: "artists" }),
        this.insights.discoveries({ ...query, entity: "recordings" }),
      ]);
      return { ...this.meta(r), artists, tracks };
    });
  }

  /** 12: favourites not played for a while. */
  async forgotten(user: User, q: Params) {
    const months = p.int("months", q.months, 6, 1, 120);
    const minListens = p.int("minListens", q.minListens, 10, 1, 100_000);
    const entity = p.entity(q.entity);
    const n = p.limit(q.limit);
    const before = this.clock() - months * 30 * DAY;
    return this.cached(user, "forgotten", [months, minListens, entity, n], async () => ({
      months,
      minListens,
      entity,
      items: await this.insights.forgotten({
        userId: user.id,
        entity,
        before,
        minListens,
        limit: n,
      }),
      lastUpdated: this.clock(),
    }));
  }

  /** 13: tracks played more in the last 7 days than in the 7 before. */
  async onRepeat(user: User, q: Params) {
    const n = p.limit(q.limit, 10);
    const now = this.clock();
    const current = { fromTs: now - 7 * DAY + 1, toTs: now };
    return this.cached(user, "on-repeat", [Math.floor(now / 3600), n], async () => ({
      from: current.fromTs,
      to: current.toTs,
      items: (
        await this.insights.compare({
          userId: user.id,
          entity: "recordings",
          current,
          previous: previousWindow(current),
          limit: n,
          order: "current",
        })
      ).filter((t) => t.current >= 2 && t.change > 0),
      lastUpdated: now,
    }));
  }

  /** 14: what goes up and down compared with the previous period of the same length. */
  async trends(user: User, q: Params) {
    const r = this.ranged(q.range ?? "this_month");
    if (r.range === "all_time")
      throw ApiError.badRequest("Trends need a bounded range, not all_time.");
    const entity = p.entity(q.entity);
    const n = p.limit(q.limit, 10);
    const previous = previousWindow(r.window);
    return this.cached(user, "trends", [r.from, entity, n], async () => {
      const base = { userId: user.id, entity, current: r.window, previous, limit: n };
      const [rising, falling] = await Promise.all([
        this.insights.compare({ ...base, order: "rising" }),
        this.insights.compare({ ...base, order: "falling" }),
      ]);
      return {
        ...this.meta(r),
        previous: { from: previous.fromTs, to: previous.toTs },
        entity,
        rising: rising.filter((t) => t.change > 0),
        falling: falling.filter((t) => t.change < 0),
      };
    });
  }

  /** 15: this period vs the previous one, with % changes. */
  async compare(user: User, q: Params) {
    const r = this.ranged(q.range ?? "this_month");
    if (r.range === "all_time")
      throw ApiError.badRequest("Comparison needs a bounded range, not all_time.");
    const previous = previousWindow(r.window);
    return this.cached(user, "compare", [r.from], async () => {
      const [now, before] = await Promise.all([
        this.stats.summary(user.id, r.window),
        this.stats.summary(user.id, previous),
      ]);
      const keys = ["listenCount", "artistCount", "recordingCount", "releaseCount"] as const;
      return {
        ...this.meta(r),
        previous: { from: previous.fromTs, to: previous.toTs },
        current: now,
        before,
        changePercent: Object.fromEntries(keys.map((k) => [k, percentChange(now[k], before[k])])),
      };
    });
  }

  /** 16: tracks played exactly once. */
  async oneShots(user: User, q: Params) {
    const r = this.ranged(q.range);
    const n = p.limit(q.limit);
    return this.cached(user, "one-shots", [r.from, n], async () => ({
      ...this.meta(r),
      ...(await this.insights.oneShots({
        userId: user.id,
        window: r.window,
        utcOffsetSeconds: 0,
        limit: n,
      })),
    }));
  }

  /** 17: an album page: totals and how each of its tracks was played. */
  async album(user: User, artistName: string, releaseName: string, q: Params) {
    const r = this.ranged(q.range);
    const key: EntityKey = {
      artistName: requireText("artist", artistName),
      releaseName: requireText("album", releaseName),
    };
    const result = await this.cached(user, "album", [r.from, key], async () => {
      const query = { userId: user.id, window: r.window, utcOffsetSeconds: 0, key };
      const [detail, tracks] = await Promise.all([
        this.insights.entity(query),
        this.insights.albumTracks(query),
      ]);
      return detail
        ? { ...this.meta(r), artist: artistName, album: releaseName, ...detail, tracks }
        : null;
    });
    if (!result)
      throw ApiError.notFound(`No listens of ${releaseName} by ${artistName} for this range.`);
    return result;
  }

  /** 18 (+11): a track page: totals, first and last listen, plays per month. */
  async track(user: User, artistName: string, trackName: string, q: Params) {
    const r = this.ranged(q.range);
    const offset = p.utcOffset(q.utcOffset);
    const key: EntityKey = {
      artistName: requireText("artist", artistName),
      trackName: requireText("track", trackName),
    };
    const result = await this.cached(user, "track", [r.from, offset, key], async () => {
      const query = { userId: user.id, window: r.window, utcOffsetSeconds: offset, key };
      const [detail, months] = await Promise.all([
        this.insights.entity(query),
        this.insights.timeline({ ...query, bucket: "month" }),
      ]);
      return detail
        ? {
            ...this.meta(r),
            artist: artistName,
            track: trackName,
            ...detail,
            byMonth: months.map((m) => ({ period: String(m.key), listenCount: m.listenCount })),
          }
        : null;
    });
    if (!result)
      throw ApiError.notFound(`No listens of ${trackName} by ${artistName} for this range.`);
    return result;
  }

  /** 19: how much an artist was played, month by month (or week / year). */
  async artistTimeline(user: User, artistName: string, q: Params) {
    const r = this.ranged(q.range);
    const offset = p.utcOffset(q.utcOffset);
    const granularity = p.oneOf(
      "granularity",
      q.granularity,
      ["week", "month", "year"] as const,
      "month",
    );
    const key: EntityKey = { artistName: requireText("artist", artistName) };
    const periods = await this.cached(
      user,
      "artist-timeline",
      [r.from, offset, granularity, key],
      async () =>
        (
          await this.insights.timeline({
            userId: user.id,
            window: r.window,
            utcOffsetSeconds: offset,
            key,
            bucket: granularity,
          })
        ).map((row) => ({
          period: bucketLabel(granularity, row.key),
          listenCount: row.listenCount,
        })),
    );
    if (periods.length === 0)
      throw ApiError.notFound(`No listens of ${artistName} for this range.`);
    return { ...this.meta(r), artist: artistName, granularity, periods };
  }

  /** 20: the top N of each month (or week / year), for an animated ranking. */
  async chart(user: User, q: Params) {
    const r = this.ranged(q.range);
    const offset = p.utcOffset(q.utcOffset);
    const entity = p.entity(q.entity);
    const granularity = p.oneOf(
      "granularity",
      q.granularity,
      ["week", "month", "year"] as const,
      "month",
    );
    const n = p.limit(q.limit, 10);
    return this.cached(user, "chart", [r.from, offset, entity, granularity, n], async () => {
      const rows = await this.insights.chart({
        userId: user.id,
        window: r.window,
        utcOffsetSeconds: offset,
        entity,
        bucket: granularity,
        limit: n,
      });
      const periods = new Map<string, typeof rows>();
      for (const row of rows) {
        const label = bucketLabel(
          granularity,
          granularity === "week" ? Number(row.period) : row.period,
        );
        periods.set(label, [...(periods.get(label) ?? []), { ...row, period: label }]);
      }
      return {
        ...this.meta(r),
        entity,
        granularity,
        periods: [...periods].map(([period, items]) => ({ period, items })),
      };
    });
  }

  /** 21: how varied the listening is. */
  async diversity(user: User, q: Params) {
    const r = this.ranged(q.range);
    return this.cached(user, "diversity", [r.from], async () => {
      const d = await this.insights.diversity({
        userId: user.id,
        window: r.window,
        utcOffsetSeconds: 0,
      });
      const share = (n: number) =>
        d.listenCount ? Math.round((n / d.listenCount) * 1000) / 10 : 0;
      return {
        ...this.meta(r),
        ...d,
        // Percentages of all listens in the range.
        top10ArtistShare: share(d.top10ArtistListens),
        topArtistShare: share(d.topArtistListens),
        uniqueArtistRatio: share(d.artistCount),
      };
    });
  }

  /** 22: listening sessions, cut after `gapMinutes` of silence. */
  async sessions(user: User, q: Params) {
    const r = this.ranged(q.range);
    const gapMinutes = p.int("gapMinutes", q.gapMinutes, 30, 5, 24 * 60);
    return this.cached(user, "sessions", [r.from, gapMinutes], async () => ({
      ...this.meta(r),
      gapMinutes,
      ...(await this.insights.sessions({
        userId: user.id,
        window: r.window,
        utcOffsetSeconds: 0,
        gapSeconds: gapMinutes * 60,
      })),
    }));
  }

  /** 23: tracks played back to back. */
  async repeats(user: User, q: Params) {
    const r = this.ranged(q.range);
    const n = p.limit(q.limit, 10);
    return this.cached(user, "repeats", [r.from, n], async () => ({
      ...this.meta(r),
      items: await this.insights.repeats({
        userId: user.id,
        window: r.window,
        utcOffsetSeconds: 0,
        limit: n,
      }),
    }));
  }

  /** 24: a year in review. */
  async wrapped(user: User, q: Params) {
    const offset = p.utcOffset(q.utcOffset);
    const thisYear = new Date(this.clock() * 1000).getUTCFullYear();
    const year = p.int("year", q.year, thisYear, 2002, thisYear);
    const window = {
      fromTs: Date.UTC(year, 0, 1) / 1000 - offset,
      toTs: Date.UTC(year + 1, 0, 1) / 1000 - 1 - offset,
    };
    return this.cached(user, "wrapped", [year, offset], async () => {
      const query = { userId: user.id, window, utcOffsetSeconds: offset };
      const top = (entity: "artists" | "recordings" | "releases") =>
        this.stats.top({ userId: user.id, entity, window, limit: 5, offset: 0 });
      const [
        summary,
        artists,
        tracks,
        albums,
        days,
        months,
        clock,
        duration,
        newArtists,
        newTracks,
        sessions,
        listeningDays,
      ] = await Promise.all([
        this.stats.summary(user.id, window),
        top("artists"),
        top("recordings"),
        top("releases"),
        this.insights.histogram({ ...query, bucket: "day" }),
        this.insights.timeline({ ...query, bucket: "month" }),
        this.insights.histogram({ ...query, bucket: "hour" }),
        this.insights.duration(query),
        this.insights.discoveries({ ...query, entity: "artists", limit: 5 }),
        this.insights.discoveries({ ...query, entity: "recordings", limit: 5 }),
        this.insights.sessions({ ...query, gapSeconds: 30 * 60 }),
        this.insights.listeningDays(query),
      ]);
      const max = <T extends { listenCount: number }>(rows: T[]) =>
        rows.reduce<T | null>((b, x) => (!b || x.listenCount > b.listenCount ? x : b), null);
      let longest = 0;
      for (let i = 0, run = 0; i < listeningDays.length; i++) {
        run = i > 0 && listeningDays[i] === listeningDays[i - 1]! + 1 ? run + 1 : 1;
        longest = Math.max(longest, run);
      }
      const day = max(days);
      const month = max(months);
      const hour = max(clock);
      return {
        year,
        utcOffset: offset / 60,
        from: window.fromTs,
        to: window.toTs,
        ...summary,
        listeningTimeMs: duration.totalMs,
        activeDays: listeningDays.length,
        longestStreakDays: longest,
        busiestDay: day
          ? { date: dayToDate(day.key as number), listenCount: day.listenCount }
          : null,
        busiestMonth: month ? { month: String(month.key), listenCount: month.listenCount } : null,
        favouriteHour: hour ? { hour: hour.key as number, listenCount: hour.listenCount } : null,
        topArtists: artists.rows.map((a) => ({ artist: a.artistName, listenCount: a.listenCount })),
        topTracks: tracks.rows.map((t) => ({
          artist: t.artistName,
          track: t.trackName,
          listenCount: t.listenCount,
        })),
        topAlbums: albums.rows.map((a) => ({
          artist: a.artistName,
          album: a.releaseName,
          listenCount: a.listenCount,
        })),
        newArtists: newArtists.total,
        newTracks: newTracks.total,
        topDiscoveries: newArtists.items,
        longestSession: sessions.longest,
        lastUpdated: this.clock(),
      };
    });
  }

  /** 25: the 1st, 100th, 1000th... listen. */
  async milestones(user: User) {
    const ns = MILESTONES.filter((n) => n <= user.listenCount);
    // Keyed on the milestones reached rather than the exact count: the 1000th listen stays the 1000th
    // as new listens arrive (only importing older history moves it, and the TTL bounds that).
    const items = await this.cached(
      user,
      "milestones",
      ns,
      () => this.insights.milestones({ userId: user.id, ns }),
      false,
    );
    return {
      listenCount: user.listenCount,
      next: MILESTONES.find((n) => n > user.listenCount) ?? null,
      items,
      lastUpdated: this.clock(),
    };
  }

  /** 26: what was played on this calendar day in previous years. */
  async onThisDay(user: User, q: Params) {
    const offset = p.utcOffset(q.utcOffset);
    const n = p.limit(q.limit, 5);
    const today = new Date((this.clock() + offset) * 1000);
    const date = q.date ?? today.toISOString().slice(0, 10);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) throw ApiError.badRequest("Invalid date: use YYYY-MM-DD.");
    const [year, month, dayOfMonth] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
    return this.cached(user, "on-this-day", [date, offset, n], async () => {
      const first = (await this.stats.summary(user.id, { fromTs: 0, toTs: this.clock() }))
        .firstListenedAt;
      const firstYear = first === null ? year : new Date((first + offset) * 1000).getUTCFullYear();
      const years: number[] = [];
      // At most 30 years back keeps this to one batch.
      for (let y = year - 1; y >= Math.max(firstYear, year - 30); y--) years.push(y);
      const windows = years.map((y) => {
        const start = Date.UTC(y, month, dayOfMonth) / 1000 - offset;
        return { fromTs: start, toTs: start + DAY - 1 };
      });
      const results = windows.length
        ? await this.insights.topInWindows({ userId: user.id, windows, limit: n })
        : [];
      return {
        date,
        utcOffset: offset / 60,
        years: years
          .map((y, i) => ({
            year: y,
            yearsAgo: year - y,
            listenCount: results[i]?.listenCount ?? 0,
            tracks: results[i]?.items ?? [],
          }))
          .filter((y) => y.listenCount > 0),
        lastUpdated: this.clock(),
      };
    });
  }
}
