/** Every tool of the server, grouped by what they touch. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./context.ts";
import { registerFavouriteTools } from "./favourites.ts";
import { registerLibraryTools } from "./library.ts";
import { registerListenTools } from "./listens.ts";
import { registerSearchTools } from "./search.ts";
import { registerStatsTools } from "./stats.ts";

export type { ToolContext } from "./context.ts";

export function registerTools(server: McpServer, ctx: ToolContext) {
  registerListenTools(server, ctx);
  registerStatsTools(server, ctx);
  registerLibraryTools(server, ctx);
  registerSearchTools(server, ctx);
  registerFavouriteTools(server, ctx);
}
