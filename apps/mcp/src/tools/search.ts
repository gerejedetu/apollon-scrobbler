/**
 * search_library: finds the exact names of artists, albums and tracks so the detail tools can be called.
 * The API has no full-text search (it would scan every listen), so this matches within the user's all-time
 * tops, which the API computes once and caches: at most one cached request per kind.
 */
import type { TopItem } from "@scrobbler/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { rank } from "../search/match.ts";
import type { ToolContext } from "./context.ts";
import { attempt, json } from "./result.ts";
import { limit } from "./schemas.ts";
import { ENTITY } from "./stats.ts";

/** How deep each all-time top is searched (the API's maximum page). */
export const SEARCH_DEPTH = 100;

type Kind = keyof typeof ENTITY;
const KINDS = Object.keys(ENTITY) as Kind[];

/** What is matched (`name`, `context`) and what is answered (`result`, without the matching text). */
function asCandidate(kind: Kind, i: TopItem) {
  const listenCount = i.listenCount;
  if (kind === "artists")
    return { name: i.artist, listenCount, result: { artist: i.artist, listenCount } };
  if (kind === "albums")
    return {
      name: i.album ?? "",
      context: i.artist,
      listenCount,
      result: { artist: i.artist, album: i.album, listenCount },
    };
  return {
    name: i.track ?? "",
    context: `${i.artist} ${i.album ?? ""}`,
    listenCount,
    result: { artist: i.artist, track: i.track, album: i.album, listenCount },
  };
}

export function registerSearchTools(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    "search_library",
    {
      title: "Search the library",
      description:
        "Finds artists, albums and tracks in the user's history by name, ignoring case, accents and punctuation " +
        "(every word of the query must appear; a track also matches on its artist and album). Use it to get the " +
        `exact names that get_artist, get_album and get_track need. It searches the ${SEARCH_DEPTH} most played ` +
        "artists, albums and tracks of all time: for something rarely played, try get_artist with the exact name.",
      inputSchema: {
        query: z.string().min(1).describe('Words to look for, e.g. "daft" or "get lucky".'),
        kind: z
          .enum(["artists", "albums", "tracks"])
          .optional()
          .describe("Only this kind (default all)."),
        limit: limit(25, 5).describe("Matches per kind, 1 to 25 (default 5)."),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ query, kind, limit = 5 }) =>
      attempt(async () => {
        const kinds = kind ? [kind] : KINDS;
        const tops = await Promise.all(
          kinds.map((k) =>
            ctx.api.stats.top(ctx.me.userName, ENTITY[k], {
              range: "all_time",
              limit: SEARCH_DEPTH,
            }),
          ),
        );
        const result: Partial<Record<Kind, unknown[]>> = {};
        kinds.forEach((k, i) => {
          const candidates = (tops[i]?.items ?? []).map((item) => asCandidate(k, item));
          result[k] = rank(query, candidates, limit).map((c) => c.result);
        });
        return json(result);
      }),
  );
}
