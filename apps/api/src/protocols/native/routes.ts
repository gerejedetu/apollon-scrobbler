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

function presentMe(user: User, owner: boolean) {
  return {
    userName: user.name,
    listenCount: user.listenCount,
    createdAt: user.createdAt,
    private: user.isPrivate,
    accent: user.accent,
    owner,
  };
}

const ENTITIES: readonly StatsEntity[] = ["artists", "recordings", "releases"];
const MAX_SUBMIT_BYTES = 11 * 1024 * 1024;

export const nativeRoutes = new Hono<AppEnv>()
  .get("/me", async (c) => {
    const user = await requireUserOrSession(c);
    return c.json(presentMe(user, await c.var.services.instance.isOwner(user)));
  })
  .patch("/me", async (c) => {
    const user = await requireUserOrSession(c);
    const body = await jsonBody(c);
    const changes = (typeof body === "object" && body !== null ? body : {}) as Record<
      string,
      unknown
    >;
    let updated = user;
    if ("private" in changes)
      updated = await c.var.services.users.setPrivate(updated, changes.private);
    if ("accent" in changes)
      updated = await c.var.services.users.setAccent(updated, changes.accent);
    return c.json(presentMe(updated, await c.var.services.instance.isOwner(updated)));
  })
  // A profile's public card: what any visitor's page header needs (404 for private and unknown users).
  .get("/users/:userName", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    return c.json({
      userName: user.name,
      createdAt: user.createdAt,
      listenCount: user.listenCount,
      accent: user.accent,
    });
  })
  // Public: the sign-in and sign-up pages only need to know whether sign-up is open.
  .get("/instance", async (c) => c.json(await c.var.services.instance.publicSettings()))
  // Owner only (401 without a session or token, 403 for any other account).
  .get("/instance/settings", async (c) => {
    const user = await requireUserOrSession(c);
    return c.json(await c.var.services.instance.ownerSettings(user));
  })
  .patch("/instance", async (c) => {
    const user = await requireUserOrSession(c);
    return c.json(await c.var.services.instance.update(user, await jsonBody(c)));
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
      albumCount: r.data.albumCount,
      firstListenedAt: r.data.firstListenedAt,
      lastListenedAt: r.data.lastListenedAt,
      topTracks: r.data.topTracks.map((t) => ({
        track: t.trackName,
        album: t.releaseName,
        recordingMbid: t.recordingMbid,
        listenCount: t.listenCount,
      })),
      albums: r.data.albums.map((a) => ({
        album: a.releaseName,
        releaseMbid: a.releaseMbid,
        listenCount: a.listenCount,
        trackCount: a.trackCount,
        firstListenedAt: a.firstListenedAt,
        lastListenedAt: a.lastListenedAt,
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
