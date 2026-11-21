/** Loved tracks and the obsession (the one track the user is hooked on right now). */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./context.ts";
import { attempt, done, json } from "./result.ts";
import { album, artist, limit, offset, track } from "./schemas.ts";

const trackRef = { artist, track, album: album.optional() };
const write = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export function registerFavouriteTools(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "get_loved_tracks",
    {
      title: "Loved tracks",
      description:
        "The tracks the user loved, most recently loved first, with when (`lovedAt`, Unix seconds).",
      inputSchema: { limit: limit(100, 25), offset },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ limit = 25, offset = 0 }) =>
      attempt(async () => {
        const page = await ctx.api.favourites.loved(ctx.me.userName, { limit, offset });
        return json({ total: page.total, offset, items: page.items });
      }),
  );

  server.registerTool(
    "love_track",
    {
      title: "Love a track",
      description:
        "Adds a track to the user's loved tracks. Loving it again keeps the first date. The album is optional.",
      inputSchema: trackRef,
      annotations: write,
    },
    (t) =>
      attempt(async () => {
        await ctx.api.favourites.love(t);
        return done(`Loved "${t.track}" by ${t.artist}.`);
      }),
  );

  server.registerTool(
    "unlove_track",
    {
      title: "Unlove a track",
      description:
        "Removes a track from the user's loved tracks. Succeeds even if it was not loved.",
      inputSchema: { artist, track },
      annotations: { ...write, destructiveHint: true },
    },
    (t) =>
      attempt(async () => {
        await ctx.api.favourites.unlove(t);
        return done(`"${t.track}" by ${t.artist} is no longer loved.`);
      }),
  );

  server.registerTool(
    "get_obsession",
    {
      title: "Current obsession",
      description:
        "The one track the user picked as their current obsession, with since when (`since`), or null.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    () =>
      attempt(async () => json((await ctx.api.favourites.obsession(ctx.me.userName)).obsession)),
  );

  server.registerTool(
    "set_obsession",
    {
      title: "Set the obsession",
      description:
        "Makes a track the user's current obsession, shown on their profile. It replaces the previous one.",
      inputSchema: trackRef,
      annotations: write,
    },
    (t) =>
      attempt(async () => {
        await ctx.api.favourites.setObsession(t);
        return done(`"${t.track}" by ${t.artist} is now the obsession.`);
      }),
  );

  server.registerTool(
    "clear_obsession",
    {
      title: "Clear the obsession",
      description: "Removes the user's current obsession, so their profile shows none.",
      inputSchema: {},
      annotations: { ...write, destructiveHint: true },
    },
    () =>
      attempt(async () => {
        await ctx.api.favourites.clearObsession();
        return done("The obsession is cleared.");
      }),
  );
}
