/** How tool answers look: compact JSON for data, a plain sentence for API errors the model can act on. */
import { ApiError } from "@scrobbler/client";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function json(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

export function done(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }] };
}

export function failure(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}

const HINTS: Record<number, string> = {
  400: "Check the arguments.",
  401: "The API token is missing, wrong or revoked: create a new one in Settings → API tokens.",
  404: "Nothing matches: names must be written exactly as listened (try search_library first).",
  429: "Too many requests: wait a minute and retry.",
};

/** Runs a tool body; API errors become tool errors (the model reads them) instead of protocol errors. */
export async function attempt(body: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await body();
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    const hint = HINTS[e.status];
    return failure(`API error ${e.status}: ${e.message}${hint ? ` ${hint}` : ""}`);
  }
}
