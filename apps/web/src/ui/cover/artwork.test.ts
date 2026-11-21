import { expect, test } from "vite-plus/test";
import { artworkSources, youtubeId } from "./artwork.ts";

test("youtubeId reads YouTube and YouTube Music pages, and the video rides along with the name lookup", () => {
  expect(youtubeId("https://music.youtube.com/watch?v=XGIAMH69y4M")).toBe("XGIAMH69y4M");
  expect(youtubeId("https://www.youtube.com/watch?v=XGIAMH69y4M&t=3")).toBe("XGIAMH69y4M");
  expect(youtubeId("https://youtu.be/XGIAMH69y4M")).toBe("XGIAMH69y4M");
  expect(youtubeId("https://open.spotify.com/track/1")).toBeNull();
  expect(youtubeId(undefined)).toBeNull();
  const [byName] = artworkSources(
    null,
    { kind: "album", artist: "엄지 (UMJI)", track: "Lemon" },
    250,
    "XGIAMH69y4M",
  );
  // The video rides along with the name lookup; alone only when there is no name to look up.
  expect(new URL(byName!, "https://x").searchParams.get("yt")).toBe("XGIAMH69y4M");
  expect(artworkSources(null, undefined, 250, "XGIAMH69y4M")).toEqual(["/covers?yt=XGIAMH69y4M"]);
});
