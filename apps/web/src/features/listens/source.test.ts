import { describe, expect, test } from "vite-plus/test";
import { formatTrackLength, listenSource } from "./source.ts";

const t = { artist: "A", track: "T" };

describe("listen source and length", () => {
  test("source chip", () => {
    expect(listenSource({ ...t, extra: { origin: "manual" } })).toBe("Ajout manuel");
    expect(listenSource({ ...t, extra: { origin: "lastfm" } })).toBe("Import Last.fm");
    expect(
      listenSource({ ...t, extra: { media_player: "Navidrome", submission_client: "x" } }),
    ).toBe("Navidrome");
    expect(listenSource({ ...t, extra: { submission_client: "Web Scrobbler" } })).toBe(
      "Web Scrobbler",
    );
    expect(listenSource(t)).toBeNull();
  });
  test("length", () => {
    expect(formatTrackLength(330_000)).toBe("5:30");
    expect(formatTrackLength(614_000)).toBe("10:14");
    expect(formatTrackLength(null)).toBe("");
  });
});
