import type { User } from "@scrobbler/types";
import { describe, expect, test } from "vite-plus/test";
import { FavouriteService } from "../src/favourites/service.ts";
import { fakeRepositories } from "./fakes.ts";

const user: User = {
  id: 1,
  name: "jules",
  createdAt: 0,
  listenCount: 0,
  isPrivate: false,
  dataVersion: 0,
  accent: null,
};
const MBID = "8F3471B5-7E6A-48DA-86A9-C1C07A0F47AE";

function service(now = { t: 100 }) {
  return new FavouriteService(fakeRepositories().favourites, () => now.t);
}

describe("FavouriteService", () => {
  test("love, list newest first, unlove", async () => {
    const now = { t: 100 };
    const s = service(now);
    await s.love(user, {
      artist: " Air ",
      track: "La femme d'argent",
      album: "Moon Safari",
      mbids: { release: MBID, recording: "nope" },
    });
    now.t = 200;
    await s.love(user, { artist: "Jennie", track: "Ruby" });
    const page = await s.loved(user);
    expect(page.total).toBe(2);
    expect(page.items.map((t) => t.trackName)).toEqual(["Ruby", "La femme d'argent"]);
    expect(page.items[1]).toMatchObject({
      artistName: "Air",
      releaseName: "Moon Safari",
      releaseMbid: MBID.toLowerCase(),
      recordingMbid: null,
      at: 100,
    });
    await s.unlove(user, "Air", "La femme d'argent");
    expect((await s.loved(user)).total).toBe(1);
  });

  test("one obsession at a time", async () => {
    const s = service();
    expect(await s.obsession(user)).toBeNull();
    await s.setObsession(user, { artist: "A", track: "One" });
    await s.setObsession(user, { artist: "B", track: "Two" });
    expect((await s.obsession(user))?.trackName).toBe("Two");
    await s.clearObsession(user);
    expect(await s.obsession(user)).toBeNull();
  });

  test("artist and track are required", async () => {
    const s = service();
    await expect(s.love(user, { artist: "", track: "x" })).rejects.toThrow("artist is required.");
    await expect(s.setObsession(user, { artist: "A", track: 3 })).rejects.toThrow(
      "track is required.",
    );
  });
});

test("obsession history: each new obsession closes the previous one; setting the same track again does not", async () => {
  const repos = fakeRepositories();
  let now = 1000;
  const s = new FavouriteService(repos.favourites, () => now);
  await s.setObsession(user, { artist: "Air", track: "La femme d'argent" });
  now = 2000;
  await s.setObsession(user, { artist: "Air", track: "La femme d'argent" });
  now = 3000;
  await s.setObsession(user, { artist: "STAYC", track: "ASAP" });
  now = 4000;
  await s.clearObsession(user);
  const { items, total } = await s.obsessionHistory(user);
  expect(total).toBe(2);
  expect(items.map((p) => [p.trackName, p.at, p.endedAt])).toEqual([
    ["ASAP", 3000, 4000],
    ["La femme d'argent", 1000, 3000],
  ]);
});
