/** Listening history: recent listens, now playing, adding and deleting a listen. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "./context.ts";
import { attempt, done, json } from "./result.ts";
import { album, artist, limit, track } from "./schemas.ts";

/** Marks listens added through an assistant, so the history shows them as manual entries. */
export const MCP_EXTRA = { origin: "manual", submission_client: "Apollon MCP" } as const;

export function registerListenTools(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "get_recent_listens",
    {
      title: "Recent listens",
      description:
        "The user's listening history, newest first. Each listen has `listenedAt` (Unix seconds, UTC) and an `id`; " +
        "both are needed to delete it. Page back with `before` = the `next` value of the previous answer " +
        "(null means there is nothing older). Use `after` / `before` to read a time window.",
      inputSchema: {
        limit: limit(100, 25),
        before: z
          .number()
          .int()
          .optional()
          .describe("Only listens strictly before this Unix time."),
        after: z.number().int().optional().describe("Only listens strictly after this Unix time."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ limit = 25, before, after }) =>
      attempt(async () => {
        const page = await ctx.api.listens.list(ctx.me.userName, { limit, before, after });
        return json({
          count: page.count,
          next: page.next,
          listens: page.listens.map((l) => ({
            id: l.id,
            listenedAt: l.listenedAt,
            artist: l.artist,
            track: l.track,
            album: l.album,
            durationMs: l.durationMs,
          })),
        });
      }),
  );

  server.registerTool(
    "get_now_playing",
    {
      title: "Now playing",
      description:
        "The track the user is playing right now, as reported by their player, or null when nothing is playing.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    () =>
      attempt(async () => {
        const { nowPlaying } = await ctx.api.listens.nowPlaying(ctx.me.userName);
        return json(
          nowPlaying && {
            artist: nowPlaying.artist,
            track: nowPlaying.track,
            album: nowPlaying.album,
          },
        );
      }),
  );

  server.registerTool(
    "submit_listen",
    {
      title: "Add a listen",
      description:
        "Adds one listen to the user's history, e.g. a record they played on vinyl or in the car. " +
        "Only do this when the user asks. `listenedAt` defaults to now; a listen with the same time and track " +
        "as an existing one is ignored (`inserted` = 0).",
      inputSchema: {
        artist,
        track,
        album: album.optional(),
        listenedAt: z
          .union([z.number().int(), z.string()])
          .optional()
          .describe(
            "When it was played: Unix seconds or an ISO 8601 date with its offset. Default: now.",
          ),
        durationMs: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Track length in milliseconds."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    (args) =>
      attempt(async () => {
        const listen = {
          artist: args.artist,
          track: args.track,
          album: args.album ?? null,
          durationMs: args.durationMs ?? null,
          listenedAt: args.listenedAt,
          extra: { ...MCP_EXTRA },
        };
        return json(await ctx.api.listens.submit([listen]));
      }),
  );

  server.registerTool(
    "delete_listen",
    {
      title: "Delete a listen",
      description:
        "Deletes one listen from the user's history for good. Take `listenedAt` and `id` from get_recent_listens, " +
        "and confirm with the user before deleting. Deleting a listen that is already gone also succeeds.",
      inputSchema: {
        listenedAt: z.number().int().describe("The listen's `listenedAt` (Unix seconds)."),
        id: z.string().min(1).describe("The listen's `id`."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ listenedAt, id }) =>
      attempt(async () => {
        await ctx.api.listens.delete({ listenedAt, id });
        return done(`Deleted the listen ${id} at ${listenedAt}.`);
      }),
  );
}
