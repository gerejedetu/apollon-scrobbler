import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { beforeEach, describe, expect, test } from "vite-plus/test";
import { obtainOAuthToken } from "@scrobbler/api/testing";
import { call, harness, MCP_URL, type Harness } from "./harness.ts";

let h: Harness;
let client: Client;
const NOW = Math.floor(Date.now() / 1000);

async function seed() {
  const listens = [
    {
      artist: "Daft Punk",
      track: "Get Lucky",
      album: "Random Access Memories",
      listenedAt: NOW - 300,
    },
    {
      artist: "Daft Punk",
      track: "Get Lucky",
      album: "Random Access Memories",
      listenedAt: NOW - 600,
    },
    { artist: "Daft Punk", track: "One More Time", album: "Discovery", listenedAt: NOW - 900 },
    { artist: "Beyoncé", track: "Déjà Vu", album: "B'Day", listenedAt: NOW - 1200 },
  ];
  for (const listen of listens) await call(client, "submit_listen", listen);
}

beforeEach(async () => {
  h = await harness();
  client = await h.connect();
});

describe("MCP server", () => {
  test("lists every tool, each with a description and read/write hints", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "clear_obsession",
      "delete_listen",
      "get_album",
      "get_artist",
      "get_listening_insight",
      "get_loved_tracks",
      "get_now_playing",
      "get_obsession",
      "get_recent_listens",
      "get_stats_summary",
      "get_top",
      "get_track",
      "get_year_in_review",
      "love_track",
      "search_library",
      "set_obsession",
      "submit_listen",
      "unlove_track",
    ]);
    for (const tool of tools) {
      expect(tool.description!.length, tool.name).toBeGreaterThan(40);
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(
        tool.name.startsWith("get_") || tool.name === "search_library",
      );
    }
    expect(tools.find((t) => t.name === "delete_listen")!.annotations!.destructiveHint).toBe(true);
    expect(client.getInstructions()).toContain("Alice");
  });

  test("submits listens marked as manual and reads them back, newest first", async () => {
    const first = await call(client, "submit_listen", {
      artist: "Daft Punk",
      track: "Get Lucky",
      listenedAt: new Date((NOW - 60) * 1000).toISOString(),
    });
    expect(first.data).toEqual({ accepted: 1, inserted: 1 });
    await call(client, "submit_listen", {
      artist: "Justice",
      track: "D.A.N.C.E.",
      listenedAt: NOW - 30,
    });

    const recent = await call(client, "get_recent_listens", { limit: 1 });
    expect(recent.data.listens).toEqual([
      expect.objectContaining({ artist: "Justice", track: "D.A.N.C.E.", listenedAt: NOW - 30 }),
    ]);
    expect(recent.data.next).toBe(NOW - 30);
    const older = await call(client, "get_recent_listens", { before: recent.data.next });
    expect(older.data.listens.map((l: any) => l.track)).toEqual(["Get Lucky"]);

    const raw = await h.api.json(`/v1/users/Alice/listens`, {
      headers: { authorization: `Token ${h.token}` },
    });
    expect(raw.body.listens[0].extra).toMatchObject({
      origin: "manual",
      submission_client: "Apollon MCP",
    });
  });

  test("deletes a listen by its time and id", async () => {
    await seed();
    const [listen] = (await call(client, "get_recent_listens", { limit: 1 })).data.listens;
    const deleted = await call(client, "delete_listen", {
      listenedAt: listen.listenedAt,
      id: listen.id,
    });
    expect(deleted.isError).toBe(false);
    const after = await call(client, "get_recent_listens");
    expect(after.data.count).toBe(3);
    // The id is the recording's (the same for every play of a track): the time tells the plays apart.
    expect(after.data.listens.map((l: any) => l.listenedAt)).not.toContain(listen.listenedAt);
  });

  test("tops by kind and period, summary, insights and the year in review", async () => {
    await seed();
    const artists = await call(client, "get_top", { kind: "artists", range: "this_year" });
    expect(artists.data.items[0]).toEqual({ artist: "Daft Punk", listenCount: 3 });
    const tracks = await call(client, "get_top", { kind: "tracks", limit: 1 });
    expect(tracks.data.items).toEqual([
      { artist: "Daft Punk", album: "Random Access Memories", track: "Get Lucky", listenCount: 2 },
    ]);
    expect(tracks.data.total).toBe(3);
    const albums = await call(client, "get_top", { kind: "albums" });
    expect(albums.data.items[0]).toEqual({
      artist: "Daft Punk",
      album: "Random Access Memories",
      listenCount: 2,
    });

    expect((await call(client, "get_stats_summary", { range: "all_time" })).data).toMatchObject({
      listenCount: 4,
      artistCount: 2,
    });
    expect((await call(client, "get_listening_insight", { insight: "streaks" })).isError).toBe(
      false,
    );
    expect(
      (await call(client, "get_listening_insight", { insight: "clock", utcOffset: 60 })).data
        .utcOffset,
    ).toBe(60);
    expect(
      (await call(client, "get_listening_insight", { insight: "milestones" })).data,
    ).toBeTruthy();
    const yearly = await call(client, "get_year_in_review", { year: new Date().getUTCFullYear() });
    expect(yearly.isError).toBe(false);
    expect(JSON.stringify(yearly.data)).toContain("Daft Punk");
  });

  test("every insight answers", async () => {
    await seed();
    const { tools } = await client.listTools();
    const schema = tools.find((t) => t.name === "get_listening_insight")!.inputSchema as any;
    for (const insight of schema.properties.insight.enum as string[]) {
      const range = insight === "trends" || insight === "compare" ? "this_month" : undefined;
      const r = await call(client, "get_listening_insight", { insight, range });
      expect(r.isError, `${insight}: ${r.text}`).toBe(false);
    }
  });

  test("artist, album and track details; unknown names are tool errors with a hint", async () => {
    await seed();
    const artist = await call(client, "get_artist", { artist: "Daft Punk" });
    expect(artist.data).toMatchObject({ artist: "Daft Punk", listenCount: 3, albumCount: 2 });
    const album = await call(client, "get_album", { artist: "Daft Punk", album: "Discovery" });
    expect(album.data.listenCount).toBe(1);
    const track = await call(client, "get_track", { artist: "Daft Punk", track: "Get Lucky" });
    expect(track.data.listenCount).toBe(2);
    const missing = await call(client, "get_artist", { artist: "Nobody" });
    expect(missing.isError).toBe(true);
    expect(missing.text).toContain("search_library");
  });

  test("search finds names regardless of case and accents, per kind", async () => {
    await seed();
    const all = await call(client, "search_library", { query: "deja vu" });
    expect(all.data.tracks).toEqual([
      { artist: "Beyoncé", track: "Déjà Vu", album: "B'Day", listenCount: 1 },
    ]);
    expect(all.data.artists).toEqual([]);
    const artists = await call(client, "search_library", { query: "DAFT", kind: "artists" });
    expect(artists.data).toEqual({ artists: [{ artist: "Daft Punk", listenCount: 3 }] });
    const byArtist = await call(client, "search_library", { query: "daft lucky", kind: "tracks" });
    expect(byArtist.data.tracks.map((t: any) => t.track)).toEqual(["Get Lucky"]);
  });

  test("love, unlove and the obsession", async () => {
    const lucky = { artist: "Daft Punk", track: "Get Lucky", album: "Random Access Memories" };
    expect((await call(client, "love_track", lucky)).isError).toBe(false);
    const loved = await call(client, "get_loved_tracks");
    expect(loved.data.total).toBe(1);
    expect(loved.data.items[0]).toMatchObject({ artist: "Daft Punk", track: "Get Lucky" });
    await call(client, "unlove_track", { artist: "Daft Punk", track: "Get Lucky" });
    expect((await call(client, "get_loved_tracks")).data.total).toBe(0);

    expect((await call(client, "get_obsession")).data).toBeNull();
    await call(client, "set_obsession", lucky);
    expect((await call(client, "get_obsession")).data).toMatchObject({ track: "Get Lucky" });
    await call(client, "clear_obsession");
    expect((await call(client, "get_obsession")).data).toBeNull();
  });

  test("now playing comes from the player", async () => {
    expect((await call(client, "get_now_playing")).data).toBeNull();
    await h.api.request("/v1/now-playing", {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: `Token ${h.token}` },
      body: JSON.stringify({ artist: "Daft Punk", track: "Get Lucky" }),
    });
    expect((await call(client, "get_now_playing")).data).toEqual({
      artist: "Daft Punk",
      track: "Get Lucky",
      album: null,
    });
  });

  test("bad arguments are rejected before reaching the API", async () => {
    const before = h.calls.length;
    const r = await call(client, "get_top", { kind: "genres" });
    expect(r.isError).toBe(true);
    expect(h.calls.length).toBe(before);
  });
});

describe("API cost", () => {
  test("one API request per tool call once the token is known; search reads three cached tops", async () => {
    await call(client, "get_now_playing");
    h.calls.length = 0;
    await call(client, "get_top", { kind: "artists" });
    expect(h.calls).toEqual([
      "GET /v1/users/Alice/stats/artists?range=all_time&limit=10&offset=0".replace(
        "range=all_time&",
        "",
      ),
    ]);
    h.calls.length = 0;
    await call(client, "search_library", { query: "x" });
    expect(h.calls).toHaveLength(3);
    expect(h.calls.every((c) => c.includes("range=all_time&limit=100"))).toBe(true);
  });
});

describe("HTTP endpoint", () => {
  const rpc = (headers: Record<string, string> = {}) =>
    new Request(MCP_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...headers,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });

  test("needs a valid token: 401 with WWW-Authenticate otherwise", async () => {
    const variants: Record<string, string>[] = [
      {},
      { authorization: "Bearer wrong" },
      { authorization: "Basic abc" },
    ];
    for (const headers of variants) {
      const res = await h.handle(rpc(headers));
      expect(res.status).toBe(401);
      expect(res.headers.get("www-authenticate")).toContain(
        'resource_metadata="http://localhost/.well-known/oauth-protected-resource/mcp"',
      );
    }
    await expect(h.connect("wrong")).rejects.toThrow();
  });

  test("works with an OAuth access token from the sign-in and consent flow", async () => {
    const token = await obtainOAuthToken(h.api, h.api.cookies.Alice!);
    const oauthClient = await h.connect(token.access_token);
    expect(oauthClient.getInstructions()).toContain("Alice");
    await call(oauthClient, "submit_listen", { artist: "Daft Punk", track: "Get Lucky" });
    expect((await call(oauthClient, "get_recent_listens")).data.count).toBe(1);
  });

  test("accepts the ListenBrainz `Token` scheme too", async () => {
    const res = await h.handle(rpc({ authorization: `Token ${h.token}` }));
    expect(res.status).toBe(200);
    expect((await res.json()).result.tools.length).toBe(18);
  });

  test("stateless: GET and DELETE are 405; CORS preflight; info at /; 404 elsewhere", async () => {
    expect((await h.handle(new Request(MCP_URL))).status).toBe(405);
    expect((await h.handle(new Request(MCP_URL, { method: "DELETE" }))).status).toBe(405);
    const preflight = await h.handle(new Request(MCP_URL, { method: "OPTIONS" }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-headers")).toContain("authorization");
    expect(await (await h.handle(new Request("http://localhost/"))).json()).toMatchObject({
      endpoint: "/mcp",
    });
    expect((await h.handle(new Request("http://localhost/other"))).status).toBe(404);
  });
});
