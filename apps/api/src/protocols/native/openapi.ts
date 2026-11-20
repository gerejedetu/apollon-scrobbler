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

const utcOffsetParam = {
  name: "utcOffset",
  in: "query",
  schema: { type: "integer", minimum: -720, maximum: 840, default: 0 },
  description:
    "Minutes to add to UTC so hours and days follow local time (Paris: 60 in winter, 120 in summer).",
};
const q = (name: string, schema: Record<string, unknown>, description?: string) => ({
  name,
  in: "query",
  schema,
  ...(description ? { description } : {}),
});
const limitParam = (fallback: number) =>
  q("limit", { type: "integer", minimum: 1, maximum: 100, default: fallback });
const entityParam = q("entity", {
  enum: ["artists", "recordings", "releases"],
  default: "artists",
});
const granularityParam = q(
  "granularity",
  { enum: ["week", "month", "year"], default: "month" },
  "Weeks start on Monday and are labelled by that Monday's date.",
);
const pathParam = (name: string, description: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
  description,
});
const entityItem = {
  type: "object",
  properties: {
    artistName: { type: "string" },
    trackName: { type: ["string", "null"] },
    releaseName: { type: ["string", "null"] },
    listenCount: { type: "integer" },
  },
};

/** A read-only per-user insight: GET, public unless the profile is private, cached until new listens arrive. */
function insight(
  summary: string,
  description: string,
  parameters: unknown[],
  properties: Record<string, unknown>,
) {
  return {
    get: {
      summary,
      description,
      tags: ["Insights"],
      parameters: [userName, ...parameters],
      responses: {
        "200": ok(summary, {
          type: "object",
          properties: { ...properties, lastUpdated: { type: "integer" } },
        }),
        "400": errors["400"],
        "404": errors["404"],
      },
    },
  };
}
const rangeProps = {
  range: { type: "string" },
  from: { type: "integer" },
  to: { type: "integer" },
};
const counted = (extra: Record<string, unknown> = {}) => ({
  type: "array",
  items: { ...entityItem, properties: { ...entityItem.properties, ...extra } },
});

const insightPaths = {
  "/users/{userName}/stats/clock": insight(
    "Listens per hour, per weekday, and the weekday × hour heatmap",
    "`heatmap[weekday][hour]`, weekday 0 = Monday. All three come from one query, so they always agree.",
    [range, utcOffsetParam],
    {
      ...rangeProps,
      utcOffset: { type: "integer" },
      hours: {
        type: "array",
        items: {
          type: "object",
          properties: { hour: { type: "integer" }, listenCount: { type: "integer" } },
        },
      },
      weekdays: {
        type: "array",
        items: {
          type: "object",
          properties: { weekday: { type: "string" }, listenCount: { type: "integer" } },
        },
      },
      heatmap: { type: "array", items: { type: "array", items: { type: "integer" } } },
    },
  ),
  "/users/{userName}/stats/streaks": insight(
    "Days in a row with at least one listen",
    "The current streak is alive if the last listening day is today or yesterday (local time).",
    [utcOffsetParam],
    {
      activeDays: { type: "integer" },
      current: {
        type: "object",
        properties: {
          days: { type: "integer" },
          since: { type: ["string", "null"], format: "date" },
        },
      },
      longest: {
        type: ["object", "null"],
        properties: { days: { type: "integer" }, from: { type: "string" }, to: { type: "string" } },
      },
    },
  ),
  "/users/{userName}/stats/discoveries": insight(
    "Artists and tracks heard for the very first time in the range",
    "`total` counts every discovery; `items` are the most played ones, with their all-time listen count.",
    [range, limitParam(25)],
    {
      ...rangeProps,
      artists: {
        type: "object",
        properties: {
          total: { type: "integer" },
          items: counted({ firstListenedAt: { type: "integer" } }),
        },
      },
      tracks: {
        type: "object",
        properties: {
          total: { type: "integer" },
          items: counted({ firstListenedAt: { type: "integer" } }),
        },
      },
    },
  ),
  "/users/{userName}/stats/forgotten": insight(
    "Favourites not played for a while",
    "Entities with at least `minListens` listens and none in the last `months` months, most played first.",
    [
      q("months", { type: "integer", minimum: 1, maximum: 120, default: 6 }),
      q("minListens", { type: "integer", minimum: 1, default: 10 }),
      entityParam,
      limitParam(25),
    ],
    {
      months: { type: "integer" },
      minListens: { type: "integer" },
      entity: { type: "string" },
      items: counted({ lastListenedAt: { type: "integer" } }),
    },
  ),
  "/users/{userName}/stats/on-repeat": insight(
    "Tracks on repeat",
    "Tracks played at least twice in the last 7 days and more than in the 7 days before.",
    [limitParam(10)],
    {
      from: { type: "integer" },
      to: { type: "integer" },
      items: counted({
        current: { type: "integer" },
        previous: { type: "integer" },
        change: { type: "integer" },
      }),
    },
  ),
  "/users/{userName}/stats/trends": insight(
    "Rising and falling artists, tracks or albums",
    "Compares the range with the previous period of the same length. `all_time` is refused.",
    [{ ...range, schema: { ...range.schema, default: "this_month" } }, entityParam, limitParam(10)],
    {
      ...rangeProps,
      previous: {
        type: "object",
        properties: { from: { type: "integer" }, to: { type: "integer" } },
      },
      rising: counted({
        current: { type: "integer" },
        previous: { type: "integer" },
        change: { type: "integer" },
      }),
      falling: counted({
        current: { type: "integer" },
        previous: { type: "integer" },
        change: { type: "integer" },
      }),
    },
  ),
  "/users/{userName}/stats/compare": insight(
    "This period against the previous one",
    "Totals of both periods and the change in percent (null when the previous period is empty). `all_time` is refused.",
    [{ ...range, schema: { ...range.schema, default: "this_month" } }],
    {
      ...rangeProps,
      current: { type: "object" },
      before: { type: "object" },
      changePercent: { type: "object", additionalProperties: { type: ["number", "null"] } },
    },
  ),
  "/users/{userName}/stats/one-shots": insight(
    "Tracks played exactly once",
    "Most recent first.",
    [range, limitParam(25)],
    { ...rangeProps, total: { type: "integer" }, items: counted() },
  ),
  "/users/{userName}/stats/chart": insight(
    "Top N of each period, for an animated ranking",
    "One entry per week, month or year with its ranked items.",
    [range, entityParam, granularityParam, limitParam(10), utcOffsetParam],
    {
      ...rangeProps,
      entity: { type: "string" },
      granularity: { type: "string" },
      periods: {
        type: "array",
        items: {
          type: "object",
          properties: {
            period: { type: "string" },
            items: counted({ rank: { type: "integer" }, period: { type: "string" } }),
          },
        },
      },
    },
  ),
  "/users/{userName}/stats/diversity": insight(
    "How varied the listening is",
    "Shares are percentages of all listens in the range.",
    [range],
    {
      ...rangeProps,
      listenCount: { type: "integer" },
      artistCount: { type: "integer" },
      topArtistListens: { type: "integer" },
      top10ArtistListens: { type: "integer" },
      topArtistShare: { type: "number" },
      top10ArtistShare: { type: "number" },
      uniqueArtistRatio: { type: "number", description: "Distinct artists per 100 listens." },
    },
  ),
  "/users/{userName}/stats/sessions": insight(
    "Listening sessions",
    "A session ends after `gapMinutes` without a listen.",
    [range, q("gapMinutes", { type: "integer", minimum: 5, maximum: 1440, default: 30 })],
    {
      ...rangeProps,
      gapMinutes: { type: "integer" },
      sessionCount: { type: "integer" },
      averageListens: { type: "number" },
      averageDurationSeconds: {
        type: "integer",
        description: "From the first to the last listen of the session.",
      },
      longest: {
        type: ["object", "null"],
        properties: {
          listenCount: { type: "integer" },
          startedAt: { type: "integer" },
          endedAt: { type: "integer" },
        },
      },
    },
  ),
  "/users/{userName}/stats/repeats": insight(
    "Tracks played back to back",
    "Each track's longest run of consecutive plays (2 or more), longest first, then most recent.",
    [range, limitParam(10)],
    {
      ...rangeProps,
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            artistName: { type: "string" },
            trackName: { type: "string" },
            longestRun: { type: "integer" },
            startedAt: { type: "integer" },
          },
        },
      },
    },
  ),
  "/users/{userName}/stats/wrapped": insight(
    "A year in review",
    "Totals, top 5 artists / tracks / albums, busiest day and month, favourite hour, longest streak and session, discoveries.",
    [
      q("year", { type: "integer", minimum: 2002 }, "Defaults to the current year."),
      utcOffsetParam,
    ],
    {
      year: { type: "integer" },
      listenCount: { type: "integer" },
      artistCount: { type: "integer" },
      listeningTimeMs: { type: "integer" },
      activeDays: { type: "integer" },
      longestStreakDays: { type: "integer" },
      busiestDay: { type: ["object", "null"] },
      busiestMonth: { type: ["object", "null"] },
      favouriteHour: { type: ["object", "null"] },
      topArtists: { type: "array" },
      topTracks: { type: "array" },
      topAlbums: { type: "array" },
      newArtists: { type: "integer" },
      newTracks: { type: "integer" },
      longestSession: { type: ["object", "null"] },
    },
  ),
  "/users/{userName}/stats/milestones": insight(
    "The 1st, 10th, 100th, 1000th... listen",
    "Milestones reached so far, and the next one.",
    [],
    {
      listenCount: { type: "integer" },
      next: { type: ["integer", "null"] },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            n: { type: "integer" },
            listenedAt: { type: "integer" },
            artistName: { type: "string" },
            trackName: { type: "string" },
            releaseName: { type: ["string", "null"] },
          },
        },
      },
    },
  ),
  "/users/{userName}/stats/on-this-day": insight(
    "On this day in previous years",
    "What was played on the same calendar day in each earlier year (up to 30 years back); years without listens are left out.",
    [
      q("date", { type: "string", format: "date" }, "Defaults to today (local time)."),
      utcOffsetParam,
      limitParam(5),
    ],
    {
      date: { type: "string" },
      years: {
        type: "array",
        items: {
          type: "object",
          properties: {
            year: { type: "integer" },
            yearsAgo: { type: "integer" },
            listenCount: { type: "integer" },
            tracks: counted(),
          },
        },
      },
    },
  ),
  "/users/{userName}/albums/{artistName}/{albumName}": insight(
    "An album page",
    "Totals and how each track of the album was played.",
    [
      pathParam("artistName", "Exact artist name, URL-encoded."),
      pathParam("albumName", "Exact album name, URL-encoded."),
      range,
    ],
    {
      ...rangeProps,
      artist: { type: "string" },
      album: { type: "string" },
      listenCount: { type: "integer" },
      firstListenedAt: { type: ["integer", "null"] },
      lastListenedAt: { type: ["integer", "null"] },
      tracks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            trackName: { type: "string" },
            listenCount: { type: "integer" },
            firstListenedAt: { type: "integer" },
            lastListenedAt: { type: "integer" },
          },
        },
      },
    },
  ),
  "/users/{userName}/tracks/{artistName}/{trackName}": insight(
    "A track page",
    "Totals, first and last listen, and plays per month.",
    [
      pathParam("artistName", "Exact artist name, URL-encoded."),
      pathParam("trackName", "Exact track title, URL-encoded."),
      range,
      utcOffsetParam,
    ],
    {
      ...rangeProps,
      artist: { type: "string" },
      track: { type: "string" },
      listenCount: { type: "integer" },
      firstListenedAt: { type: ["integer", "null"] },
      lastListenedAt: { type: ["integer", "null"] },
      byMonth: {
        type: "array",
        items: {
          type: "object",
          properties: { period: { type: "string" }, listenCount: { type: "integer" } },
        },
      },
    },
  ),
  "/users/{userName}/artists/{artistName}/timeline": insight(
    "An artist over time",
    "Plays of one artist per week, month or year.",
    [
      pathParam("artistName", "Exact artist name, URL-encoded."),
      range,
      granularityParam,
      utcOffsetParam,
    ],
    {
      ...rangeProps,
      artist: { type: "string" },
      granularity: { type: "string" },
      periods: {
        type: "array",
        items: {
          type: "object",
          properties: { period: { type: "string" }, listenCount: { type: "integer" } },
        },
      },
    },
  ),
};

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
    ...insightPaths,
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
        summary: "Listens per day, week, month or year, for a chart",
        description:
          "`granularity=day` (default) returns `days`, where every day of the range is present (0 when nothing was played; `all_time` starts at the first listen). `week`, `month` and `year` return `periods` with only the periods that have listens.",
        parameters: [
          userName,
          range,
          q("granularity", { enum: ["day", "week", "month", "year"], default: "day" }),
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
              granularity: { type: "string" },
              periods: {
                type: "array",
                items: {
                  type: "object",
                  properties: { period: { type: "string" }, listenCount: { type: "integer" } },
                },
              },
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
        summary: "Totals, busiest day, listening time and averages",
        description:
          "`listeningTime.totalMs` only adds up durations sent by clients (`durationMs`); `listensWithDuration` says how many listens had one.",
        parameters: [userName, range, utcOffsetParam],
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
              activeDays: { type: "integer" },
              averagePerDay: { type: "number" },
              averagePerActiveDay: { type: "number" },
              busiestDay: {
                type: ["object", "null"],
                properties: { date: { type: "string" }, listenCount: { type: "integer" } },
              },
              listeningTime: {
                type: "object",
                properties: {
                  totalMs: { type: "integer" },
                  listensWithDuration: { type: "integer" },
                },
              },
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
