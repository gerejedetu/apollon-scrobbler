import { describe, expect, test } from "vite-plus/test";
import { estimateFromTotal, estimateListeningMs, TYPICAL_TRACK_MS } from "./listening-time.ts";

describe("listening time", () => {
  test("imports without durations count a typical track each", () => {
    // 754 listens, only 15 with a duration (about an hour): not "1 h".
    expect(estimateListeningMs(754, 3_600_000, 15)).toBe(3_600_000 + 739 * TYPICAL_TRACK_MS);
  });
  test("with enough known durations, their average fills the gaps", () => {
    expect(estimateListeningMs(100, 50 * 240_000, 50)).toBe(100 * 240_000);
  });
  test("complete data is unchanged", () => {
    expect(estimateListeningMs(10, 2_000_000, 10)).toBe(2_000_000);
    expect(estimateListeningMs(0, 0, 0)).toBe(0);
  });
  test("a clearly partial total is estimated", () => {
    expect(estimateFromTotal(754, 3_600_000)).toBe(754 * TYPICAL_TRACK_MS);
    expect(estimateFromTotal(10, 2_400_000)).toBe(2_400_000);
  });
});
