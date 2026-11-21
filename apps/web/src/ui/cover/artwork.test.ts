import { expect, test } from "vite-plus/test";
import { artworkSources, youtubeId } from "./artwork.ts";

test("youtubeId reads YouTube and YouTube Music pages, and the thumbnail comes last", () => {
  expect(youtubeId("https://music.youtube.com/watch?v=XGIAMH69y4M")).toBe("XGIAMH69y4M");
  expect(youtubeId("https://www.youtube.com/watch?v=XGIAMH69y4M&t=3")).toBe("XGIAMH69y4M");
  expect(youtubeId("https://youtu.be/XGIAMH69y4M")).toBe("XGIAMH69y4M");
  expect(youtubeId("https://open.spotify.com/track/1")).toBeNull();
  expect(youtubeId(undefined)).toBeNull();
  expect(
    artworkSources(
      null,
      { kind: "album", artist: "엄지 (UMJI)", track: "Lemon" },
      250,
      "XGIAMH69y4M",
    ).at(-1),
  ).toBe("/covers?yt=XGIAMH69y4M");
});
