/** One artist, album or track of the user's library, by its name as listened. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./context.ts";
import { attempt, json } from "./result.ts";
import { album, artist, limit, range, track, utcOffset } from "./schemas.ts";

const NOT_LISTENED =
  "A 404 means no listen matches in that period: names must match exactly, so find them with search_library.";

export function registerLibraryTools(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "get_artist",
    {
      title: "Artist details",
      description:
        "Everything about one artist in the user's history: listen count, distinct tracks and albums, first and " +
        `last listen, most played tracks and every album with its counts. ${NOT_LISTENED}`,
      inputSchema: {
        artist,
        range,
        limit: limit(100, 10).describe("How many top tracks (default 10)."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ artist, range, limit = 10 }) =>
      attempt(async () =>
        json(await ctx.api.library.artist(ctx.me.userName, artist, { range, limit })),
      ),
  );

  server.registerTool(
    "get_album",
    {
      title: "Album details",
      description:
        "One album in the user's history: listen count, first and last listen, and how often each of its tracks " +
        `was played. ${NOT_LISTENED}`,
      inputSchema: { artist, album, range },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ artist, album, range }) =>
      attempt(async () =>
        json(await ctx.api.library.album(ctx.me.userName, artist, album, { range })),
      ),
  );

  server.registerTool(
    "get_track",
    {
      title: "Track details",
      description:
        "One track in the user's history: listen count, first and last listen, and listens per month. " +
        NOT_LISTENED,
      inputSchema: { artist, track, range, utcOffset },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ artist, track, range, utcOffset }) =>
      attempt(async () =>
        json(await ctx.api.library.track(ctx.me.userName, artist, track, { range, utcOffset })),
      ),
  );
}
