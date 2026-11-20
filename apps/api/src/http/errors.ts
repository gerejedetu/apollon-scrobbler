/** Every error leaves the API in ListenBrainz's shape: `{ "code": 400, "error": "..." }`. */
import { ApiError } from "@scrobbler/core";
import type { Context, ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../env.ts";

function send(c: Context, code: number, error: string) {
  return c.json({ code, error }, code as ContentfulStatusCode);
}

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof ApiError) return send(c, err.code, err.message);
  if (err instanceof HTTPException) return send(c, err.status, err.message || "Request failed.");
  console.error(err);
  return send(c, 500, "An unknown error occurred.");
};

export const notFound: NotFoundHandler<AppEnv> = (c) => send(c, 404, "Not found.");

/** Parses the JSON body, mapping malformed JSON to ListenBrainz's 400. */
export async function jsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw ApiError.badRequest("Invalid JSON document submitted.");
  }
}
