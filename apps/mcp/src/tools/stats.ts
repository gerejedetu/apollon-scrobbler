/** Tops, summaries, insights and the year in review. All are computed by the API and cached there. */
import type { Entity } from "@scrobbler/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./context.ts";
import { attempt, json } from "./result.ts";
import { limit, offset, range, utcOffset } from "./schemas.ts";

/** The words people use, mapped to the API's (ListenBrainz) entity names. */
export const ENTITY = { artists: "artists", albums: "releases", tracks: "recordings" } as const;
const kind = z.enum(["artists", "albums", "tracks"]);

export const INSIGHTS = [
  "activity",
  "clock",
  "streaks",
  "discoveries",
  "forgotten",
  "on_repeat",
  "trends",
  "compare",
  "one_shots",
  "diversity",
  "sessions",
  "milestones",
  "on_this_day",
] as const;
export type Insight = (typeof INSIGHTS)[number];

interface InsightArgs {
  range?: string;
  utcOffset?: number;
  limit?: number;
  entity?: keyof typeof ENTITY;
  granularity?: "day" | "week" | "month" | "year";
  months?: number;
  minListens?: number;
  gapMinutes?: number;
  date?: string;
}

/** One API call per insight; arguments an endpoint does not take are simply not sent. */
export function fetchInsight(ctx: ToolContext, insight: Insight, a: InsightArgs): Promise<unknown> {
  const s = ctx.api.stats;
  const name = ctx.me.userName;
  const r = a.range as Parameters<typeof s.summary>[1]["range"];
  const entity: Entity | undefined = a.entity && ENTITY[a.entity];
  switch (insight) {
    case "activity":
      return s.activity(name, { range: r, granularity: a.granularity, utcOffset: a.utcOffset });
    case "clock":
      return s.clock(name, { range: r, utcOffset: a.utcOffset });
    case "streaks":
      return s.streaks(name, { utcOffset: a.utcOffset });
    case "discoveries":
      return s.discoveries(name, { range: r, limit: a.limit });
    case "forgotten":
      return s.forgotten(name, {
        months: a.months,
        minListens: a.minListens,
        entity,
        limit: a.limit,
      });
    case "on_repeat":
      return s.onRepeat(name, { limit: a.limit });
    case "trends":
      return s.trends(name, { range: r, entity, limit: a.limit });
    case "compare":
      return s.compare(name, { range: r });
    case "one_shots":
      return s.oneShots(name, { range: r, limit: a.limit });
    case "diversity":
      return s.diversity(name, { range: r });
    case "sessions":
      return s.sessions(name, { range: r, gapMinutes: a.gapMinutes });
    case "milestones":
      return s.milestones(name);
    case "on_this_day":
      return s.onThisDay(name, { date: a.date, utcOffset: a.utcOffset, limit: a.limit });
  }
}

export function registerStatsTools(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "get_top",
    {
      title: "Top artists, albums or tracks",
      description:
        "The user's most played artists, albums or tracks over a period, with listen counts, most played first. " +
        "`total` is how many distinct items the period has; page with `offset`. " +
        'Artist tops count a joint credit ("A feat. B") for each artist.',
      inputSchema: { kind, range, limit: limit(100, 10), offset },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ kind, range, limit = 10, offset = 0 }) =>
      attempt(async () => {
        const top = await ctx.api.stats.top(ctx.me.userName, ENTITY[kind], {
          range,
          limit,
          offset,
        });
        return json({
          kind,
          range: top.range,
          from: top.from,
          to: top.to,
          total: top.total,
          offset,
          items: top.items.map((i) => ({
            artist: i.artist,
            ...(kind === "artists" ? {} : { album: i.album }),
            ...(kind === "tracks" ? { track: i.track } : {}),
            listenCount: i.listenCount,
          })),
        });
      }),
  );

  server.registerTool(
    "get_stats_summary",
    {
      title: "Listening summary",
      description:
        "Totals for a period: listens, listening time, distinct artists / albums / tracks, first and last listen, " +
        'active days, daily averages and the busiest day. Start here for "how much did I listen this month?".',
      inputSchema: { range, utcOffset },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ range, utcOffset }) =>
      attempt(async () => json(await ctx.api.stats.summary(ctx.me.userName, { range, utcOffset }))),
  );

  server.registerTool(
    "get_listening_insight",
    {
      title: "Listening insight",
      description:
        "One detailed view of the user's habits. `insight` picks it:\n" +
        "- activity: listens per day (or per week / month / year with `granularity`), for a chart\n" +
        "- clock: listens per hour of day and per weekday (use `utcOffset` for local hours)\n" +
        "- streaks: current and longest run of days with listens (whole history)\n" +
        "- discoveries: artists and tracks heard for the very first time in the period\n" +
        "- forgotten: former favourites not played for `months` months (at least `minListens` listens)\n" +
        "- on_repeat: tracks played at least twice in the last 7 days, and more than in the 7 days before\n" +
        "- trends: biggest rises and drops versus the previous period of the same length (`entity`; not all_time)\n" +
        "- compare: totals of the period next to the previous one, with the change in percent (not all_time)\n" +
        "- one_shots: tracks played exactly once in the period\n" +
        "- diversity: distinct artists, share of listens of the top artist and the top 10, artists per 100 listens\n" +
        "- sessions: listening sessions (a gap over `gapMinutes` starts a new one) and the longest\n" +
        "- milestones: the 1st, 10th, 100th, 1000th… listen ever, what it was and when, and the next one to reach\n" +
        "- on_this_day: what was played on this calendar day in earlier years (`date` = YYYY-MM-DD)\n" +
        "Arguments an insight does not use are ignored.",
      inputSchema: {
        insight: z.enum(INSIGHTS),
        range,
        utcOffset,
        limit: limit(100, 10),
        entity: kind
          .optional()
          .describe("For forgotten and trends: what to rank (default artists)."),
        granularity: z
          .enum(["day", "week", "month", "year"])
          .optional()
          .describe("For activity: size of each period (default day)."),
        months: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("For forgotten: months without a listen."),
        minListens: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("For forgotten: minimum listens ever."),
        gapMinutes: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("For sessions: silence that ends one."),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("For on_this_day: YYYY-MM-DD (default today)."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ insight, ...args }) => attempt(async () => json(await fetchInsight(ctx, insight, args))),
  );

  server.registerTool(
    "get_year_in_review",
    {
      title: "Year in review",
      description:
        "A Wrapped-style recap of one year: totals, listening time, active days, longest streak, busiest day " +
        "and month, favourite hour, top 5 artists / tracks / albums, discoveries and the longest session.",
      inputSchema: {
        year: z
          .number()
          .int()
          .min(1970)
          .max(9999)
          .optional()
          .describe("Default: the current year."),
        utcOffset,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ year, utcOffset }) =>
      attempt(async () => json(await ctx.api.stats.wrapped(ctx.me.userName, { year, utcOffset }))),
  );
}
