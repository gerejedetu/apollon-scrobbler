/**
 * Cost guard: runs every endpoint once, then checks the query plan of every SQL statement that touched
 * the database. A plan that scans a whole table (all users' rows) instead of seeking an index fails the test,
 * because on D1 every row read is billed.
 */
import { expect, test } from "vite-plus/test";
import { openApiDocument } from "../src/protocols/native/openapi.ts";
import { TEST_DB, testApi } from "./helpers.ts";
import type { SqliteD1 } from "@scrobbler/testing";

const NOW = Date.parse("2026-11-20T12:00:00Z") / 1000;

// Plans come from the node:sqlite double (same SQLite planner as libSQL and D1).
test.skipIf(TEST_DB !== "d1")("no endpoint makes SQLite scan a whole table", async () => {
  const api = testApi({}, NOW);
  const token = await api.signUp("alice");
  await api.signUp("bob");
  const auth = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const listens = Array.from({ length: 50 }, (_, i) => ({
    listenedAt: NOW - i * 7200,
    artist: ["Air", "Moby", "Daft Punk"][i % 3],
    track: `T${i % 5}`,
    album: `A${i % 2}`,
    durationMs: 200_000,
  }));
  await api.request("/v1/listens", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ listens }),
  });
  await api.request("/v1/now-playing", {
    method: "PUT",
    headers: auth,
    body: JSON.stringify({ artist: "Air", track: "x" }),
  });
  await api.request("/1/submit-listens", {
    method: "POST",
    headers: { ...auth, authorization: `Token ${token}` },
    body: JSON.stringify({
      listen_type: "single",
      payload: [{ listened_at: NOW, track_metadata: { artist_name: "Air", track_name: "y" } }],
    }),
  });

  // Every documented GET, plus the ListenBrainz reads.
  const gets = Object.entries(openApiDocument.paths)
    .filter(([, ops]) => "get" in ops)
    .map(([path]) =>
      path
        .replace("{userName}", "alice")
        .replace("{entity}", "artists")
        .replace("{artistName}", "Air")
        .replace("{albumName}", "A0")
        .replace("{trackName}", "T0"),
    );
  const lb = [
    "/user/alice/listens",
    "/user/alice/listens?min_ts=1",
    "/user/alice/listen-count",
    "/user/alice/playing-now",
    "/stats/user/alice/releases",
    "/latest-import?user_name=alice",
    "/validate-token",
  ];
  for (const path of gets) await api.request(`/v1${path}`, { headers: auth });
  for (const path of lb)
    await api.request(`/1${path}`, { headers: { authorization: `Token ${token}` } });
  await api.request("/v1/me", { method: "PATCH", headers: auth, body: '{"private":true}' });
  await api.request("/v1/users/alice/stats/wrapped?year=2026", { headers: auth });

  const seen = new Map<string, unknown[]>();
  for (const { sql, params } of (api.db as SqliteD1).log) if (!seen.has(sql)) seen.set(sql, params);
  const offenders: string[] = [];
  for (const [sql, params] of seen) {
    if (/^\s*(INSERT|PRAGMA|BEGIN|COMMIT)/i.test(sql)) continue;
    const plan = (api.db as SqliteD1).raw
      .prepare(`EXPLAIN QUERY PLAN ${sql}`)
      .all(...(params as never[])) as {
      detail: string;
    }[];
    // "SCAN <table>" without an index = every row of the table, for every user.
    const full = plan.filter((p) =>
      /^SCAN (listens|users|"?user"?|session|account|apikey|playing_now|latest_imports)\b(?! USING)/.test(
        p.detail,
      ),
    );
    if (full.length)
      offenders.push(
        `${sql.replace(/\s+/g, " ").slice(0, 160)}\n    -> ${full.map((p) => p.detail).join(" | ")}`,
      );
  }
  expect(seen.size).toBeGreaterThan(30);
  expect(offenders).toEqual([]);
});
