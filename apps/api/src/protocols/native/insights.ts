/**
 * Extended per-user statistics (`/v1/users/{userName}/...`). Mounted before routes.ts so that
 * `/stats/<name>` wins over the generic `/stats/:entity`.
 */
import type { InsightParams, InsightsService } from "@scrobbler/core";
import type { User } from "@scrobbler/types";
import { Hono } from "hono";
import type { AppEnv } from "../../env.ts";
import { readableUser } from "../../http/require-user.ts";

type Simple = (s: InsightsService, user: User, q: InsightParams) => Promise<unknown>;

/** `/stats/<name>` endpoints that only take query parameters. */
const STATS: Record<string, Simple> = {
  clock: (s, u, q) => s.listeningClock(u, q),
  streaks: (s, u, q) => s.streaks(u, q),
  discoveries: (s, u, q) => s.discoveries(u, q),
  forgotten: (s, u, q) => s.forgotten(u, q),
  "on-repeat": (s, u, q) => s.onRepeat(u, q),
  trends: (s, u, q) => s.trends(u, q),
  compare: (s, u, q) => s.compare(u, q),
  "one-shots": (s, u, q) => s.oneShots(u, q),
  chart: (s, u, q) => s.chart(u, q),
  diversity: (s, u, q) => s.diversity(u, q),
  sessions: (s, u, q) => s.sessions(u, q),
  "album-sessions": (s, u, q) => s.albumSessions(u, q),
  repeats: (s, u, q) => s.repeats(u, q),
  wrapped: (s, u, q) => s.wrapped(u, q),
  milestones: (s, u) => s.milestones(u),
  "on-this-day": (s, u, q) => s.onThisDay(u, q),
};

export const INSIGHT_STATS = Object.keys(STATS);

export const insightRoutes = new Hono<AppEnv>();

for (const [name, run] of Object.entries(STATS)) {
  insightRoutes.get(`/users/:userName/stats/${name}`, async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    return c.json((await run(c.var.services.insights, user, c.req.query())) as object);
  });
}

insightRoutes
  .get("/users/:userName/albums/:artistName/:albumName", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    return c.json(
      await c.var.services.insights.album(
        user,
        c.req.param("artistName"),
        c.req.param("albumName"),
        c.req.query(),
      ),
    );
  })
  .get("/users/:userName/tracks/:artistName/:trackName", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    return c.json(
      await c.var.services.insights.track(
        user,
        c.req.param("artistName"),
        c.req.param("trackName"),
        c.req.query(),
      ),
    );
  })
  .get("/users/:userName/artists/:artistName/timeline", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    return c.json(
      await c.var.services.insights.artistTimeline(user, c.req.param("artistName"), c.req.query()),
    );
  });
