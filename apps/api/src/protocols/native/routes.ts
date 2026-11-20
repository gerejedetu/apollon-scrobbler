/** Native API routes. Same services as the ListenBrainz protocol, simpler shapes. */
import { ApiError, systemClock } from "@scrobbler/core";
import type { StatsEntity, User } from "@scrobbler/types";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { AppEnv } from "../../env.ts";
import { jsonBody } from "../../http/errors.ts";
import { requireUserOrSession, readableUser } from "../../http/require-user.ts";
import {
  fromApiListen,
  fromTrackMetadata,
  presentNativeStats,
  toSubmission,
  toTrackMetadata,
} from "./mapping.ts";

function presentMe(user: User) {
  return {
    userName: user.name,
    listenCount: user.listenCount,
    createdAt: user.createdAt,
    private: user.isPrivate,
  };
}

const ENTITIES: readonly StatsEntity[] = ["artists", "recordings", "releases"];
const MAX_SUBMIT_BYTES = 11 * 1024 * 1024;

export const nativeRoutes = new Hono<AppEnv>()
  .get("/me", async (c) => {
    const user = await requireUserOrSession(c);
    return c.json(presentMe(user));
  })
  .patch("/me", async (c) => {
    const user = await requireUserOrSession(c);
    const body = await jsonBody(c);
    const changes = (typeof body === "object" && body !== null ? body : {}) as Record<
      string,
      unknown
    >;
    const updated =
      "private" in changes ? await c.var.services.users.setPrivate(user, changes.private) : user;
    return c.json(presentMe(updated));
  })
  .post(
    "/listens",
    bodyLimit({
      maxSize: MAX_SUBMIT_BYTES,
      onError: () => {
        throw new ApiError(413, "Payload too large.");
      },
    }),
    async (c) => {
      const user = await requireUserOrSession(c);
      const result = await c.var.services.listens.submit(
        user,
        toSubmission(await jsonBody(c), systemClock()),
      );
      return c.json(result);
    },
  )
  .delete("/listens/:listenedAt/:id", async (c) => {
    const user = await requireUserOrSession(c);
    const listenedAt = Number(c.req.param("listenedAt"));
    await c.var.services.listens.delete(user, {
      listened_at: listenedAt,
      recording_msid: c.req.param("id"),
    });
    return c.body(null, 204);
  })
  .put("/now-playing", async (c) => {
    const user = await requireUserOrSession(c);
    const meta = toTrackMetadata(await jsonBody(c), "body");
    await c.var.services.listens.submit(user, {
      listen_type: "playing_now",
      payload: [{ track_metadata: meta }],
    });
    return c.body(null, 204);
  })
  .get("/users/:userName/listens", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    const { before, after, limit } = c.req.query();
    const page = await c.var.services.listens.list(user, {
      max_ts: before,
      min_ts: after,
      count: limit,
    });
    const listens = page.listens.map(fromApiListen);
    const last = listens.at(-1);
    return c.json({
      userName: user.name,
      count: listens.length,
      listens,
      oldestListenedAt: page.oldest_listen_ts,
      latestListenedAt: page.latest_listen_ts,
      // Pass as `before` to get the next (older) page; null when this is the last one.
      next:
        last && page.oldest_listen_ts !== null && last.listenedAt > page.oldest_listen_ts
          ? last.listenedAt
          : null,
    });
  })
  .get("/users/:userName/now-playing", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    const track = await c.var.services.listens.current(user);
    return c.json({ userName: user.name, nowPlaying: track ? fromTrackMetadata(track) : null });
  })
  .get("/users/:userName/stats/activity", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    const { range, utcOffset, granularity } = c.req.query();
    // Per week / month / year comes from insights; per day (the default) fills empty days with 0.
    if (granularity && granularity !== "day")
      return c.json(await c.var.services.insights.activity(user, c.req.query()));
    const r = await c.var.services.stats.activity(user, { range, utcOffset });
    return c.json({
      range: r.range,
      from: r.window.fromTs,
      to: r.window.toTs,
      granularity: "day",
      utcOffset: Number(utcOffset ?? 0),
      days: r.data,
      lastUpdated: r.lastUpdated,
    });
  })
  .get("/users/:userName/stats/summary", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    return c.json(await c.var.services.insights.overview(user, c.req.query()));
  })
  .get("/users/:userName/artists/:artistName", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    const { range, limit } = c.req.query();
    const r = await c.var.services.stats.artist(user, c.req.param("artistName"), {
      range,
      count: limit,
    });
    return c.json({
      range: r.range,
      from: r.window.fromTs,
      to: r.window.toTs,
      artist: r.data.artistName,
      mbids: r.data.artistMbids,
      listenCount: r.data.listenCount,
      trackCount: r.data.trackCount,
      firstListenedAt: r.data.firstListenedAt,
      lastListenedAt: r.data.lastListenedAt,
      topTracks: r.data.topTracks.map((t) => ({
        track: t.trackName,
        album: t.releaseName,
        recordingMbid: t.recordingMbid,
        listenCount: t.listenCount,
      })),
      lastUpdated: r.lastUpdated,
    });
  })
  .get("/users/:userName/stats/:entity", async (c) => {
    const entity = c.req.param("entity") as StatsEntity;
    if (!ENTITIES.includes(entity))
      throw ApiError.notFound(`Unknown stats: ${entity}. Use ${ENTITIES.join(", ")}.`);
    const user = await readableUser(c, c.req.param("userName"));
    const { range, limit, offset } = c.req.query();
    const result = await c.var.services.stats.top(user, entity, { range, count: limit, offset });
    return c.json(presentNativeStats(result, Number(offset ?? 0)));
  });
