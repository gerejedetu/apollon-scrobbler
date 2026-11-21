import { describe, expect, test } from "vite-plus/test";
import { localToUnix, parseDuration, validateScrobble } from "./model.ts";

const base = {
  artist: "Massive Attack",
  track: "Teardrop",
  album: "",
  duration: "",
  when: "now" as const,
  date: "",
  time: "",
};

describe("manual scrobble", () => {
  test("durations", () => {
    expect(parseDuration("5:30")).toBe(330_000);
    expect(parseDuration("4")).toBe(240_000);
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("5:7")).toBeUndefined();
    expect(parseDuration("abc")).toBeUndefined();
  });

  test("now, with optional album and duration", () => {
    const r = validateScrobble({ ...base, album: " Mezzanine ", duration: "5:30" }, 1_800_000_000);
    expect(r).toEqual({
      listen: {
        artist: "Massive Attack",
        track: "Teardrop",
        album: "Mezzanine",
        durationMs: 330_000,
        listenedAt: 1_800_000_000,
      },
    });
  });

  test("another moment is read in local time and cannot be in the future", () => {
    const at = localToUnix("2026-11-15", "22:40")!;
    expect(
      validateScrobble({ ...base, when: "other", date: "2026-11-15", time: "22:40" }, at + 3600),
    ).toMatchObject({
      listen: { listenedAt: at },
    });
    expect(
      validateScrobble({ ...base, when: "other", date: "2026-11-15", time: "22:40" }, at - 3600),
    ).toEqual({
      errors: { date: "Cette heure n'est pas encore passée." },
    });
  });

  test("required fields", () => {
    expect(validateScrobble({ ...base, artist: " ", track: "", duration: "x" })).toEqual({
      errors: {
        artist: "Indique l'artiste.",
        track: "Indique le titre du morceau.",
        duration: "Au format m:ss, par exemple 3:45.",
      },
    });
  });
});
