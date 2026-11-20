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
const userName = {
  name: "userName",
  in: "path",
  required: true,
  schema: { type: "string" },
  description:
    "Case-insensitive. A private profile is readable only by its owner (send the token or session); others get 404.",
};
const range = {
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
  description:
    "this_* = current period so far; week, month, quarter, half_yearly, year = last complete one (UTC).",
};
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
      Me: {
        type: "object",
        properties: {
          userName: { type: "string" },
          listenCount: { type: "integer" },
          createdAt: { type: "integer" },
          private: { type: "boolean" },
        },
      },
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
        responses: { "200": ok("Profile", ref("Me")), "401": errors["401"] },
      },
      patch: {
        summary: "Update the signed-in user's settings",
        description:
          "`private: true` hides the profile: its listens, now playing and stats answer 404 to everyone but the owner (with their token or session), exactly as for an unknown user.",
        security: secured,
        requestBody: {
          required: true,
          content: json({ type: "object", properties: { private: { type: "boolean" } } }),
        },
        responses: {
          "200": ok("Updated profile", ref("Me")),
          "400": errors["400"],
          "401": errors["401"],
        },
      },
    },
    "/listens": {
      post: {
        summary: "Submit up to 1000 listens",
        description:
          "Idempotent: a listen identical to one already stored (same user, same `listenedAt`, same `track`) is ignored, " +
          "so clients can safely resend after a network failure. `accepted` counts the listens received, `inserted` " +
          "the new ones (a full resend answers `inserted: 0`).",
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
        description:
          'Replaces the previous entry. It expires on its own, so a closed player does not stay "playing" forever: ' +
          "after `durationMs` when given (capped at 1 hour), otherwise after 8 minutes (ListenBrainz's default). " +
          "Now-playing is not a listen: submit the listen to `/listens` when the track is done.",
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
    "/users/{userName}/stats/activity": {
      get: {
        summary: "Listens per day, for a chart",
        description:
          "Every day of the range is present, with 0 when nothing was played. `all_time` starts at the first listen.",
        parameters: [
          userName,
          range,
          {
            name: "utcOffset",
            in: "query",
            schema: { type: "integer", minimum: -720, maximum: 840, default: 0 },
            description:
              "Minutes to add to UTC to cut days at local midnight (Paris: 60 in winter, 120 in summer).",
          },
        ],
        responses: {
          "200": ok("Activity", {
            type: "object",
            properties: {
              range: { type: "string" },
              from: { type: "integer" },
              to: { type: "integer" },
              utcOffset: { type: "integer" },
              lastUpdated: { type: "integer" },
              days: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string", format: "date" },
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
    "/users/{userName}/stats/summary": {
      get: {
        summary: "Totals: listens, artists, recordings, releases",
        parameters: [userName, range],
        responses: {
          "200": ok("Summary", {
            type: "object",
            properties: {
              range: { type: "string" },
              from: { type: "integer" },
              to: { type: "integer" },
              listenCount: { type: "integer" },
              artistCount: { type: "integer" },
              recordingCount: { type: "integer", description: "Distinct artist + title pairs." },
              releaseCount: { type: "integer", description: "Distinct artist + album pairs." },
              firstListenedAt: { type: ["integer", "null"] },
              lastListenedAt: { type: ["integer", "null"] },
              lastUpdated: { type: "integer" },
            },
          }),
          "400": errors["400"],
          "404": errors["404"],
        },
      },
    },
    "/users/{userName}/artists/{artistName}": {
      get: {
        summary: "An artist's page: totals and most played tracks",
        parameters: [
          userName,
          {
            name: "artistName",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Exact artist name, URL-encoded.",
          },
          range,
          { name: "limit", in: "query", schema: { type: "integer", default: 25, maximum: 100 } },
        ],
        responses: {
          "200": ok("Artist", {
            type: "object",
            properties: {
              range: { type: "string" },
              from: { type: "integer" },
              to: { type: "integer" },
              artist: { type: "string" },
              mbids: { type: "array", items: { type: "string", format: "uuid" } },
              listenCount: { type: "integer" },
              trackCount: { type: "integer" },
              firstListenedAt: { type: ["integer", "null"] },
              lastListenedAt: { type: ["integer", "null"] },
              lastUpdated: { type: "integer" },
              topTracks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    track: { type: "string" },
                    album: { type: ["string", "null"] },
                    recordingMbid: { type: ["string", "null"] },
                    listenCount: { type: "integer" },
                  },
                },
              },
            },
          }),
          "404": ok("Unknown user, or no listen of this artist in the range", ref("Error")),
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
          range,
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
