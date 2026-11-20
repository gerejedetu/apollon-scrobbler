import { describe, expect, test } from "vite-plus/test";
import { parseCsv } from "./csv.ts";
import { batches, NotALastFmExport, parseLastFmExport } from "./lastfm.ts";

const HEADER = "uts,utc_time,artist,artist_mbid,album,album_mbid,track,track_mbid";
const MB = "0d79fe8e-ba27-4859-bb8c-2f255f346853";

describe("parseCsv", () => {
  test("quotes, escaped quotes, commas and CRLF", () => {
    expect(parseCsv('a,"b, c","say ""hi"""\r\n"x\ny",2\n')).toEqual([
      ["a", "b, c", 'say "hi"'],
      ["x\ny", "2"],
    ]);
  });
});

describe("Last.fm export", () => {
  test("rows become listens with their MBIDs", () => {
    const csv = `${HEADER}\n"1794937144","17 Nov 2026, 17:39","Some Band","${MB}","An Album","","A Song","not-an-mbid"\n"1794902016","x","Other","","","","Track, with comma","${MB}"\n`;
    const parsed = parseLastFmExport(csv);
    expect(parsed.skipped).toBe(0);
    expect(parsed.listens).toEqual([
      {
        artist: "Some Band",
        track: "A Song",
        album: "An Album",
        listenedAt: 1794937144,
        mbids: { recording: null, release: null, artists: [MB] },
      },
      {
        artist: "Other",
        track: "Track, with comma",
        album: null,
        listenedAt: 1794902016,
        mbids: { recording: MB, release: null, artists: [] },
      },
    ]);
    expect(parsed.from).toBe(1794902016);
    expect(parsed.to).toBe(1794937144);
  });

  test("broken rows are counted, not imported", () => {
    const parsed = parseLastFmExport(
      `${HEADER}\n"0","","A","","","","T",""\n"12","","","","","","T",""\n`,
    );
    expect(parsed.listens).toHaveLength(0);
    expect(parsed.skipped).toBe(2);
  });

  test("another CSV is refused", () => {
    expect(() => parseLastFmExport("name,email\nx,y\n")).toThrow(NotALastFmExport);
  });

  test("batches of 1000", () => {
    expect(batches(Array.from({ length: 2500 }, (_, i) => i)).map((b) => b.length)).toEqual([
      1000, 1000, 500,
    ]);
  });
});
