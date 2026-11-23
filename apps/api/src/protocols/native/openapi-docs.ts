/**
 * Human documentation layered on top of the OpenAPI shapes in openapi.ts: the API overview, tags,
 * and for every operation an operationId, a tag and a full description; for every parameter a description.
 * Kept apart so that openapi.ts stays about shapes. A test checks that nothing is left undocumented.
 */

export const API_DESCRIPTION = `
Native JSON API of a self-hosted music scrobbler: send what you listen to, read it back, and get statistics.

The same server also speaks the **ListenBrainz API** under \`/1\`, so any app that can scrobble to
ListenBrainz with a custom server URL (Pano Scrobbler, Web Scrobbler, Navidrome, Jellyfin, Multi-Scrobbler…)
works without changes. Both APIs read and write the same data.

Interactive reference: \`/v1/docs\`. Raw document: \`/v1/openapi.json\`.

## Getting started

1. Create an account: \`POST /api/auth/sign-up/email\` with \`email\`, \`password\`, \`name\` and \`username\`.
2. While signed in, create a token: \`POST /api/auth/api-key/create\`. The key is shown **once**.
3. Send it as \`Authorization: Bearer <token>\` (or \`Token <token>\`, the ListenBrainz form).
   A browser signed in through \`/api/auth\` can use its session cookie instead.

## Conventions

- **Times** are Unix seconds (UTC). Endpoints that group by hour or day accept \`utcOffset\` (minutes east
  of UTC, e.g. \`60\` for Paris in winter) so days start at local midnight.
- **Ranges** (\`range\`): \`this_week\`, \`this_month\`, \`this_year\` run from the start of the current period
  to now; \`week\`, \`month\`, \`quarter\`, \`half_yearly\`, \`year\` are the last complete period; \`all_time\` is
  everything. Weeks start on Monday. Periods are computed in UTC.
- **Names** of users are case-insensitive. Artist, track and album names in paths are exact and URL-encoded.
- **Errors** always look like \`{ "code": 404, "error": "Cannot find user: bob" }\`.
- **Private profiles**: a user who set \`private: true\` is invisible to everyone else. Every read about them
  answers 404, exactly like an unknown user, unless the request carries their own token or session.
- **Freshness**: statistics are computed from the stored listens; for large histories they are cached until
  the next listen arrives, so they are always up to date.
- **Limits**: about 600 requests per minute per token or IP, 10 sign-in / sign-up attempts per minute per IP.
  Over the limit the answer is \`429\` with \`Retry-After\`.
`.trim();

export const TAGS = [
  { name: "Account", description: "The signed-in user and their settings." },
  {
    name: "Listens",
    description: "Sending, reading and deleting listens, and what is playing now.",
  },
  {
    name: "Favourites",
    description: "Loved tracks and the current obsession, as on Last.fm.",
  },
  { name: "Stats", description: "Top lists, totals and listening activity over a range." },
  {
    name: "Insights",
    description:
      "Deeper statistics: listening clock, streaks, discoveries, trends, sessions, year in review…",
  },
  { name: "Pages", description: "Everything about one artist, album or track." },
];

interface OperationDoc {
  operationId: string;
  tag: string;
  description: string;
  /** Example request body, shown by documentation tools. */
  requestExample?: unknown;
}

/** Keyed by "METHOD /path" as written in the paths object. */
export const OPERATIONS: Record<string, OperationDoc> = {
  "GET /me": {
    operationId: "getMe",
    tag: "Account",
    description:
      "Returns the profile of the token owner (or of the signed-in browser session): name, listen count, creation date, privacy setting, and whether this user owns the instance (`owner`, the first account: the one allowed to change instance settings).",
  },
  "PATCH /me": {
    operationId: "updateMe",
    tag: "Account",
    description:
      "Changes settings of the signed-in user. Only the fields sent are changed. `private: true` hides the profile: its listens, now playing and every statistic answer 404 to anyone but the owner, as if the user did not exist.",
    requestExample: { private: true },
  },
  "PUT /me/loved": {
    operationId: "loveTrack",
    tag: "Favourites",
    description:
      "Adds a track (artist + title) to your loved tracks; loving it again keeps the first date. `album` and MusicBrainz ids are optional and only help show artwork.",
    requestExample: { artist: "Air", track: "La femme d'argent", album: "Moon Safari" },
  },
  "DELETE /me/loved": {
    operationId: "unloveTrack",
    tag: "Favourites",
    description: "Removes a track from your loved tracks. Answers 204 even if it was not loved.",
  },
  "PUT /me/obsession": {
    operationId: "setObsession",
    tag: "Favourites",
    description:
      "Makes a track your current obsession, replacing the previous one. Shown on your profile.",
    requestExample: { artist: "Peso Pluma", track: "Bellakeo" },
  },
  "DELETE /me/obsession": {
    operationId: "clearObsession",
    tag: "Favourites",
    description: "Clears your current obsession: your profile no longer shows one.",
  },
  "GET /users/{userName}/loved": {
    operationId: "listLoved",
    tag: "Favourites",
    description:
      "A user's loved tracks, most recently loved first, `limit` per page with `offset`; `total` counts them all.",
  },
  "GET /users/{userName}/obsession": {
    operationId: "getObsession",
    tag: "Favourites",
    description: "A user's current obsession, or `obsession: null`.",
  },
  "GET /users/{userName}/search": {
    operationId: "searchLibrary",
    tag: "Pages",
    description:
      "Artists, albums and tracks of the user's own listens whose name contains `q` (case-insensitive for Latin letters). Names that start with `q` come first, then the most listened. Up to `limit` of each.",
  },
  "GET /users/{userName}/obsessions": {
    operationId: "listObsessions",
    tag: "Favourites",
    description:
      "Every obsession the user has had, newest first: each with when it started (`since`) and when it was replaced or cleared (`until`, null for the current one). Setting the same track again does not start a new period.",
  },
  "GET /instance": {
    operationId: "getInstance",
    tag: "Account",
    description:
      "Public settings of this instance. `signupOpen` says whether the sign-up form should be offered: sign-up is open until the first account exists, then closed unless the owner reopens it (and always closed when the operator sets `DISABLE_SIGNUP`).",
  },
  "PATCH /instance": {
    operationId: "updateInstance",
    tag: "Account",
    description:
      "Changes instance settings. Only the owner (the first account created) may do it; anyone else gets 403. `signupOpen: true` lets new people create accounts, `false` closes sign-up again. Closing is enforced by the server, not just hidden in the front.",
    requestExample: { signupOpen: true },
  },
  "POST /listens": {
    operationId: "submitListens",
    tag: "Listens",
    description:
      "Stores 1 to 1000 listens in one request (one database write whatever the count).\n\n" +
      "**Idempotent**: a listen identical to one already stored (same user, same `listenedAt`, same `track`) is ignored, so a client can safely resend everything after a network failure. `accepted` is the number of listens received, `inserted` the number of new ones: a full resend answers `inserted: 0`.\n\n" +
      "`listenedAt` defaults to now and accepts Unix seconds or an ISO 8601 date. Invalid MusicBrainz ids are dropped rather than rejected. `extra` keeps any other data the client wants (player name, source URL…).",
    requestExample: {
      listens: [
        {
          listenedAt: "2026-11-20T08:30:00Z",
          artist: "Daft Punk",
          track: "Digital Love",
          album: "Discovery",
          durationMs: 301000,
          mbids: { recording: "8f3471b5-7e6a-48da-86a9-c1c07a0f47ae" },
          extra: { player: "Navidrome" },
        },
        { listenedAt: 1795162200, artist: "Air", track: "La femme d'argent" },
      ],
    },
  },
  "DELETE /listens/{listenedAt}/{id}": {
    operationId: "deleteListen",
    tag: "Listens",
    description:
      "Deletes one of your listens, identified by its `listenedAt` and its `id` (both returned when reading listens). Answers 204 even if the listen did not exist.",
  },
  "PUT /now-playing": {
    operationId: "setNowPlaying",
    tag: "Listens",
    description:
      'Says what is playing right now; it replaces the previous entry. It expires on its own, so a closed player does not stay "playing" forever: after `durationMs` when given (capped at 1 hour), otherwise after 8 minutes (ListenBrainz\'s default).\n\nNow playing is not a listen: send the listen to `POST /listens` when the track is done.',
    requestExample: {
      artist: "Air",
      track: "Playground Love",
      album: "The Virgin Suicides",
      durationMs: 213000,
    },
  },
  "GET /users/{userName}/listens": {
    operationId: "listListens",
    tag: "Listens",
    description:
      "A user's listens, newest first, `limit` per page (max 1000). To page backwards, pass the `next` value of a response as `before` in the next request; `next` is null on the last page. `after` returns the listens just after a time (still newest first).",
  },
  "GET /users/{userName}/now-playing": {
    operationId: "getNowPlaying",
    tag: "Listens",
    description:
      "What the user is playing right now, or `nowPlaying: null` when nothing is playing (or the entry expired).",
  },
  "GET /users/{userName}/stats/{entity}": {
    operationId: "getTop",
    tag: "Stats",
    description:
      "The most played artists, recordings (artist + title) or releases (artist + album) over the range, with their listen counts. `total` is the number of distinct entries, for pagination with `limit` and `offset`.",
  },
  "GET /users/{userName}/stats/activity": {
    operationId: "getActivity",
    tag: "Stats",
    description:
      "How many listens per day (default), week, month or year, ready for a chart.\n\nWith `granularity=day`, `days` contains every day of the range, including days without listens (count 0); for `all_time` it starts at the first listen. With `week`, `month` or `year`, `periods` only contains periods that have listens; weeks are labelled by their Monday.",
  },
  "GET /users/{userName}/stats/summary": {
    operationId: "getSummary",
    tag: "Stats",
    description:
      "Totals over the range: listens, distinct artists, recordings and releases, first and last listen, number of days with listens, average listens per day (over the whole range and per active day), the busiest day, and the listening time.\n\n`listeningTime.totalMs` only adds up durations that clients sent (`durationMs`); `listensWithDuration` says how many listens had one, so you can tell how complete it is.",
  },
  "GET /users/{userName}/stats/clock": {
    operationId: "getListeningClock",
    tag: "Insights",
    description:
      "When the user listens: counts per hour of the day (0–23), per weekday (Monday first), and the full weekday × hour heatmap (`heatmap[weekday][hour]`, weekday 0 = Monday). Use `utcOffset` to see local hours. The three views come from one query and always add up to the same total.",
  },
  "GET /users/{userName}/stats/streaks": {
    operationId: "getStreaks",
    tag: "Insights",
    description:
      "Days in a row with at least one listen, over the whole history: the current streak (still alive if the last listening day is today or yesterday, local time) with its start date, the longest streak ever with its dates, and the number of days with listens.",
  },
  "GET /users/{userName}/stats/discoveries": {
    operationId: "getDiscoveries",
    tag: "Insights",
    description:
      "Artists and tracks the user heard **for the very first time** during the range (their first listen ever falls in it). `total` counts all discoveries; `items` lists the ones played most since, with the date of the first listen.",
  },
  "GET /users/{userName}/stats/forgotten": {
    operationId: "getForgotten",
    tag: "Insights",
    description:
      "Former favourites: artists, recordings or releases with at least `minListens` listens in total but none in the last `months` months, most played first, with the date of their last listen.",
  },
  "GET /users/{userName}/stats/on-repeat": {
    operationId: "getOnRepeat",
    tag: "Insights",
    description:
      "Tracks on repeat right now: played at least twice in the last 7 days and more than in the 7 days before, most played first, with both counts.",
  },
  "GET /users/{userName}/stats/trends": {
    operationId: "getTrends",
    tag: "Insights",
    description:
      "What goes up and what goes down: compares listen counts in the range with the previous period of the same length (for `this_*` ranges, the same number of days just before). `rising` lists the biggest increases, `falling` the biggest drops. `all_time` cannot be compared and answers 400.",
  },
  "GET /users/{userName}/stats/compare": {
    operationId: "comparePeriods",
    tag: "Insights",
    description:
      "Totals of the range next to those of the previous period of the same length, with the change in percent for listens, artists, recordings and releases (null when the previous period is empty). `all_time` answers 400.",
  },
  "GET /users/{userName}/stats/one-shots": {
    operationId: "getOneShots",
    tag: "Insights",
    description:
      "Tracks played exactly once during the range, most recent first, with their total.",
  },
  "GET /users/{userName}/stats/chart": {
    operationId: "getChart",
    tag: "Insights",
    description:
      'The top `limit` artists, recordings or releases of every week, month or year in the range, with their rank: everything needed for an animated ranking ("bar chart race") or a history of number ones.',
  },
  "GET /users/{userName}/stats/diversity": {
    operationId: "getDiversity",
    tag: "Insights",
    description:
      "How varied the listening is: number of distinct artists, share of all listens that went to the single most played artist and to the top 10 (percent), and distinct artists per 100 listens.",
  },
  "GET /users/{userName}/stats/sessions": {
    operationId: "getSessions",
    tag: "Insights",
    description:
      "Listening sessions: listens are grouped into one session as long as they are less than `gapMinutes` apart (30 by default). Returns the number of sessions, their average length in listens and in time, and the longest one.",
  },
  "GET /users/{userName}/stats/repeats": {
    operationId: "getRepeats",
    tag: "Insights",
    description:
      "Tracks played several times back to back (at least twice in a row, nothing else in between): each track's longest run, longest first, and when it started.",
  },
  "GET /users/{userName}/stats/wrapped": {
    operationId: "getYearInReview",
    tag: "Insights",
    description:
      "A year in review for `year` (the current year by default), in local time with `utcOffset`: totals, listening time, active days, longest streak, busiest day and month, favourite hour, top 5 artists / tracks / albums, how many artists and tracks were discovered (with the top discoveries), and the longest session.",
  },
  "GET /users/{userName}/stats/milestones": {
    operationId: "getMilestones",
    tag: "Insights",
    description:
      "The 1st, 10th, 100th, 250th, 500th, 1000th… listen ever, with what was played and when, for every milestone reached so far, plus the next milestone to reach.",
  },
  "GET /users/{userName}/stats/on-this-day": {
    operationId: "getOnThisDay",
    tag: "Insights",
    description:
      "What was played on the same calendar day in previous years (up to 30 years back): for each year with listens on that day, how many and the most played tracks. `date` defaults to today in local time.",
  },
  "GET /users/{userName}/artists/{artistName}": {
    operationId: "getArtist",
    tag: "Pages",
    description:
      "Everything about one artist over the range: listen count, number of distinct tracks and albums, first and last listen, MusicBrainz ids, the most played tracks and the albums (most played first). 404 when the artist was not played in the range.",
  },
  "GET /users/{userName}/artists/{artistName}/timeline": {
    operationId: "getArtistTimeline",
    tag: "Pages",
    description:
      "How much one artist was played per week, month or year, for a chart. Periods without listens are left out.",
  },
  "GET /users/{userName}/albums/{artistName}/{albumName}": {
    operationId: "getAlbum",
    tag: "Pages",
    description:
      "Everything about one album (artist + album name) over the range: listen count, first and last listen, and how each of its tracks was played. 404 when it was not played in the range.",
  },
  "GET /users/{userName}/tracks/{artistName}/{trackName}": {
    operationId: "getTrack",
    tag: "Pages",
    description:
      'Everything about one track (artist + title) over the range: listen count, first listen ("since when") and last listen, and plays per month. 404 when it was not played in the range.',
  },
};

/** Default descriptions of parameters, by name, used wherever a parameter has none of its own. */
export const PARAMETERS: Record<string, string> = {
  userName:
    "The user's name, case-insensitive. A private profile is readable only with its owner's token or session; anyone else gets 404.",
  range:
    "Time range. `this_*` = current period so far; `week`, `month`, `quarter`, `half_yearly`, `year` = last complete one; `all_time` = everything (UTC).",
  utcOffset:
    "Minutes east of UTC so hours and days follow local time (Paris: 60 in winter, 120 in summer).",
  limit: "How many items to return.",
  offset: "How many items to skip, for pagination.",
  entity: "What to rank: `artists`, `recordings` (artist + title) or `releases` (artist + album).",
  granularity: "Size of each period. Weeks start on Monday and are labelled by that Monday's date.",
  artistName: "Exact artist name, URL-encoded (e.g. `Daft%20Punk`).",
  albumName: "Exact album name, URL-encoded.",
  trackName: "Exact track title, URL-encoded.",
  listenedAt: "When the listen happened, in Unix seconds (as returned by the listing).",
  id: "The listen's id (`id` in the listing).",
  before:
    "Only listens strictly older than this time (Unix seconds). Pass a page's `next` here to get the next page.",
  after: "Only listens strictly newer than this time (Unix seconds).",
  months: "How long without a listen counts as forgotten, in months (30 days each).",
  minListens: "Minimum number of listens over all time for something to count as a favourite.",
  gapMinutes: "Silence, in minutes, after which a new session starts.",
  q: "Text to look for in artist, album and track names.",
};

type Json = Record<string, unknown>;

/** Applies OPERATIONS and PARAMETERS to an OpenAPI document; throws if an operation has no documentation. */
export function enrich<T extends { paths: Json; info: Json }>(doc: T): T & { tags: typeof TAGS } {
  const paths = doc.paths as Record<string, Record<string, Json>>;
  for (const [path, ops] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(ops)) {
      const docs = OPERATIONS[`${method.toUpperCase()} ${path}`];
      if (!docs) throw new Error(`Undocumented operation: ${method.toUpperCase()} ${path}`);
      op.operationId = docs.operationId;
      op.tags = [docs.tag];
      op.description = docs.description;
      if (docs.requestExample !== undefined) {
        const content = (op.requestBody as { content?: Record<string, Json> } | undefined)
          ?.content?.["application/json"];
        if (content) content.example = docs.requestExample;
      }
      op.parameters = ((op.parameters as Json[] | undefined) ?? []).map((p) =>
        p.description ? p : { ...p, description: PARAMETERS[p.name as string] ?? "" },
      );
    }
  }
  return { ...doc, info: { ...doc.info, description: API_DESCRIPTION }, tags: TAGS };
}
