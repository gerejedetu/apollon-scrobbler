/** Loved tracks, the obsession and its history (see core's FavouriteService), and library search. */
import type { TrackRef } from "@scrobbler/core";
import type { FavouriteTrack } from "@scrobbler/types";
import { Hono } from "hono";
import type { AppEnv } from "../../env.ts";
import { jsonBody } from "../../http/errors.ts";
import { readableUser, requireUserOrSession } from "../../http/require-user.ts";

/** Same shape as a Track, plus when it was set. */
export function presentFavourite(t: FavouriteTrack, dateField: "lovedAt" | "since") {
  return {
    artist: t.artistName,
    track: t.trackName,
    album: t.releaseName,
    mbids: { recording: t.recordingMbid, release: t.releaseMbid },
    [dateField]: t.at,
  };
}

const asRef = (body: unknown): TrackRef =>
  (typeof body === "object" && body !== null ? body : {}) as TrackRef;

export const favouriteRoutes = new Hono<AppEnv>()
  .get("/users/:userName/loved", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    const { limit, offset } = c.req.query();
    const page = await c.var.services.favourites.loved(user, { limit, offset });
    return c.json({
      userName: user.name,
      total: page.total,
      items: page.items.map((t) => presentFavourite(t, "lovedAt")),
    });
  })
  .put("/me/loved", async (c) => {
    const user = await requireUserOrSession(c);
    await c.var.services.favourites.love(user, asRef(await jsonBody(c)));
    return c.body(null, 204);
  })
  .delete("/me/loved", async (c) => {
    const user = await requireUserOrSession(c);
    await c.var.services.favourites.unlove(user, c.req.query("artist"), c.req.query("track"));
    return c.body(null, 204);
  })
  .get("/users/:userName/obsession", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    const t = await c.var.services.favourites.obsession(user);
    return c.json({ userName: user.name, obsession: t ? presentFavourite(t, "since") : null });
  })
  .get("/users/:userName/search", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    const r = await c.var.services.search.search(user, c.req.query());
    return c.json({
      userName: user.name,
      query: r.query,
      artists: r.artists.map((a) => ({ artist: a.artistName, listenCount: a.listenCount })),
      albums: r.albums.map((a) => ({
        artist: a.artistName,
        album: a.releaseName,
        mbids: { release: a.releaseMbid },
        listenCount: a.listenCount,
      })),
      tracks: r.tracks.map((t) => ({
        artist: t.artistName,
        track: t.trackName,
        album: t.releaseName,
        mbids: { release: t.releaseMbid },
        listenCount: t.listenCount,
      })),
    });
  })
  .get("/users/:userName/obsessions", async (c) => {
    const user = await readableUser(c, c.req.param("userName"));
    const { limit, offset } = c.req.query();
    const page = await c.var.services.favourites.obsessionHistory(user, { limit, offset });
    const period = (p: (typeof page.items)[number]) => ({
      ...presentFavourite(p, "since"),
      until: p.endedAt,
    });
    return c.json({
      userName: user.name,
      total: page.total,
      // The obsession kept longest (the current one counts up to now): what "Obsédé" laurels look at.
      longest: page.longest ? period(page.longest) : null,
      items: page.items.map(period),
    });
  })
  .put("/me/obsession", async (c) => {
    const user = await requireUserOrSession(c);
    await c.var.services.favourites.setObsession(user, asRef(await jsonBody(c)));
    return c.body(null, 204);
  })
  .delete("/me/obsession", async (c) => {
    const user = await requireUserOrSession(c);
    await c.var.services.favourites.clearObsession(user);
    return c.body(null, 204);
  });
