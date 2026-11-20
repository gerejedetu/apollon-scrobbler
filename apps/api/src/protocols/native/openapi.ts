/**
 * OpenAPI 3.1 description of the native API, served at `/v1/openapi.json`.
 * Keep in sync with routes.ts: tests check that every path documented here is routed.
 */
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: unknown) => ({ "application/json": { schema } });
const ok = (description: string, schema?: unknown) => ({
  description,
  ...(schema ? { content: json(schema) } : {}),
});
const errors = {
  "400": ok("Invalid request", ref("Error")),
  "401": ok("Missing or invalid token", ref("Error")),
  "404": ok("Unknown user", ref("Error")),
};
const userName = { name: "userName", in: "path", required: true, schema: { type: "string" } };
const secured = [{ token: [] }, { session: [] }];

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Scrobbler API",
    version: "1.0.0",
    description:
      "Native JSON API of the scrobbler. The ListenBrainz-compatible API is also served under /1 for existing clients.",
    license: { name: "AGPL-3.0-only", identifier: "AGPL-3.0-only" },
  },
  servers: [{ url: "/v1" }],
  components: {
    securitySchemes: {
      token: {
        type: "http",
        scheme: "bearer",
        description: "A user token (Better Auth API key). `Authorization: Token <key>` works too.",
      },
      session: { type: "apiKey", in: "cookie", name: "better-auth.session_token" },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["code", "error"],
        properties: { code: { type: "integer" }, error: { type: "string" } },
      },
      Mbids: {
        type: "object",
        properties: {
          recording: { type: ["string", "null"], format: "uuid" },
          release: { type: ["string", "null"], format: "uuid" },
          artists: { type: "array", items: { type: "string", format: "uuid" } },
        },
      },
      Track: {
        type: "object",
        required: ["artist", "track"],
        properties: {
          artist: { type: "string" },
          track: { type: "string" },
          album: { type: ["string", "null"] },
          durationMs: { type: ["integer", "null"], minimum: 1 },
          mbids: ref("Mbids"),
          extra: {
            type: "object",
            additionalProperties: true,
            description: "Free-form data kept with the listen.",
          },
        },
      },
      ListenInput: {
        allOf: [
          ref("Track"),
          {
            type: "object",
            properties: {
              listenedAt: {
                oneOf: [
                  { type: "integer", description: "Unix seconds" },
                  { type: "string", format: "date-time" },
                ],
                description: "Defaults to now.",
              },
            },
          },
        ],
      },
      Listen: {
        allOf: [
          ref("Track"),
          {
            type: "object",
            required: ["id", "listenedAt", "insertedAt"],
            properties: {
              id: { type: "string" },
              listenedAt: { type: "integer" },
              insertedAt: { type: "integer" },
            },
          },
        ],
      },
    },
  },
  paths: {
    "/me": {
      get: {
        summary: "The signed-in user",
        security: secured,
        responses: {
          "200": ok("Profile", {
            type: "object",
            properties: {
              userName: { type: "string" },
              listenCount: { type: "integer" },
              createdAt: { type: "integer" },
            },
          }),
          "401": errors["401"],
        },
      },
    },
    "/listens": {
      post: {
        summary: "Submit up to 1000 listens",
        description: "Duplicates (same time and track) are ignored.",
        security: secured,
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["listens"],
            properties: {
              listens: { type: "array", minItems: 1, maxItems: 1000, items: ref("ListenInput") },
            },
          }),
        },
        responses: {
          "200": ok("Stored", {
            type: "object",
            properties: { accepted: { type: "integer" }, inserted: { type: "integer" } },
          }),
          "400": errors["400"],
          "401": errors["401"],
        },
      },
    },
    "/listens/{listenedAt}/{id}": {
      delete: {
        summary: "Delete one listen",
        security: secured,
        parameters: [
          { name: "listenedAt", in: "path", required: true, schema: { type: "integer" } },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "204": ok("Deleted (or already absent)"), "401": errors["401"] },
      },
    },
    "/now-playing": {
      put: {
        summary: "Set what is playing now",
        description: "Expires after durationMs, or 8 minutes without it.",
        security: secured,
        requestBody: { required: true, content: json(ref("Track")) },
        responses: { "204": ok("Set"), "400": errors["400"], "401": errors["401"] },
      },
    },
    "/users/{userName}/listens": {
      get: {
        summary: "A user's listens, newest first",
        parameters: [
          userName,
          {
            name: "before",
            in: "query",
            schema: { type: "integer" },
            description: "Only listens strictly older (Unix seconds).",
          },
          {
            name: "after",
            in: "query",
            schema: { type: "integer" },
            description: "Only listens strictly newer (Unix seconds).",
          },
          { name: "limit", in: "query", schema: { type: "integer", default: 25, maximum: 1000 } },
        ],
        responses: {
          "200": ok("Page", {
            type: "object",
            properties: {
              userName: { type: "string" },
              count: { type: "integer" },
              listens: { type: "array", items: ref("Listen") },
              oldestListenedAt: { type: ["integer", "null"] },
              latestListenedAt: { type: ["integer", "null"] },
              next: {
                type: ["integer", "null"],
                description: "Pass as `before` for the next page.",
              },
            },
          }),
          "404": errors["404"],
        },
      },
    },
    "/users/{userName}/now-playing": {
      get: {
        summary: "What a user is playing now",
        parameters: [userName],
        responses: {
          "200": ok("Now playing", {
            type: "object",
            properties: {
              userName: { type: "string" },
              nowPlaying: { oneOf: [ref("Track"), { type: "null" }] },
            },
          }),
          "404": errors["404"],
        },
      },
    },
    "/users/{userName}/stats/{entity}": {
      get: {
        summary: "Top artists, recordings or releases",
        parameters: [
          userName,
          {
            name: "entity",
            in: "path",
            required: true,
            schema: { enum: ["artists", "recordings", "releases"] },
          },
          {
            name: "range",
            in: "query",
            schema: {
              enum: [
                "this_week",
                "this_month",
                "this_year",
                "week",
                "month",
                "quarter",
                "half_yearly",
                "year",
                "all_time",
              ],
              default: "all_time",
            },
          },
          { name: "limit", in: "query", schema: { type: "integer", default: 25, maximum: 100 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": ok("Stats", {
            type: "object",
            properties: {
              entity: { type: "string" },
              range: { type: "string" },
              from: { type: "integer" },
              to: { type: "integer" },
              total: { type: "integer" },
              offset: { type: "integer" },
              lastUpdated: { type: "integer" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    artist: { type: "string" },
                    track: { type: ["string", "null"] },
                    album: { type: ["string", "null"] },
                    mbids: ref("Mbids"),
                    listenCount: { type: "integer" },
                  },
                },
              },
            },
          }),
          "400": errors["400"],
          "404": errors["404"],
        },
      },
    },
  },
} as const;
