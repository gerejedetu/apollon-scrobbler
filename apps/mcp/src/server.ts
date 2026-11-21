/** The MCP server for one request: the caller's API, their profile, and every tool. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker";
import { registerTools, type ToolContext } from "./tools/index.ts";

export const SERVER_INFO = { name: "apollon", title: "Apollon", version: "1.0.0" } as const;

const instructions = (userName: string) =>
  `Apollon is ${userName}'s music scrobbler: every track they play is recorded as a listen. ` +
  "These tools read their history and stats and can love tracks, set their obsession, add or delete a listen. " +
  "Times are Unix seconds (UTC); pass utcOffset (minutes east of UTC) where a tool takes it to get local days " +
  "and hours. Names of artists, albums and tracks must be exact: find them with search_library or get_top. " +
  "Ask before deleting anything.";

export function createMcpServer(ctx: ToolContext): McpServer {
  const server = new McpServer(SERVER_INFO, {
    instructions: instructions(ctx.me.userName),
    // Ajv (the default) compiles schemas with `new Function`, which Workers forbid.
    jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
  });
  registerTools(server, ctx);
  return server;
}
