/**
 * The MCP server in front of the real API (in-process, on the test database): an MCP SDK client talks to the
 * Worker handler, which reaches the API through a fake service binding that records every request.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { testApi, type TestApi } from "@scrobbler/api/testing";
import type { Bindings } from "../src/env.ts";
import { createHandler } from "../src/http/handler.ts";
import { memoryViewerCache } from "../src/http/viewer.ts";

export const MCP_URL = "https://mcp.test/mcp";

export interface Harness {
  api: TestApi;
  token: string;
  /** Paths the MCP server requested from the API, in order. */
  calls: string[];
  handle(request: Request): Promise<Response>;
  connect(token?: string): Promise<Client>;
}

export async function harness(): Promise<Harness> {
  const api = testApi();
  const token = await api.signUp("Alice");
  const calls: string[] = [];
  const env: Bindings = {
    API: {
      async fetch(request) {
        const url = new URL(request.url);
        calls.push(`${request.method} ${url.pathname}${url.search}`);
        const body = request.method === "GET" ? undefined : await request.text();
        return api.request(url.pathname + url.search, {
          method: request.method,
          headers: request.headers,
          body: body || undefined,
        });
      },
    },
  };
  const handler = createHandler(memoryViewerCache());
  const handle = (request: Request) => handler(request, env);
  return {
    api,
    token,
    calls,
    handle,
    async connect(withToken = token) {
      const client = new Client({ name: "test", version: "0.0.0" });
      const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
        requestInit: { headers: { authorization: `Bearer ${withToken}` } },
        fetch: (input, init) => handle(new Request(input, init)),
      });
      await client.connect(transport);
      return client;
    },
  };
}

/** Calls a tool and parses its JSON answer (or returns the text of a sentence / error). */
export async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = (await client.callTool({ name, arguments: args })) as CallToolResult;
  const text = result.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {
    // A sentence, not JSON.
  }
  return { isError: result.isError === true, data, text };
}
