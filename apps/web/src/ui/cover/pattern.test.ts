import { describe, expect, test } from "vite-plus/test";
import { coverPattern, hash } from "./pattern.ts";

describe("cover patterns", () => {
  test("same name, same cover (case-insensitive)", () => {
    expect(coverPattern("In Rainbows")).toEqual(coverPattern("in rainbows"));
  });
  test("names spread over the palettes", () => {
    const names = Array.from({ length: 60 }, (_, i) => `Album ${i}`);
    expect(new Set(names.map((n) => coverPattern(n).bg)).size).toBeGreaterThan(6);
    expect(new Set(names.map((n) => coverPattern(n).motif)).size).toBe(5);
  });
  test("hash is stable", () => {
    expect(hash("Mezzanine")).toBe(hash("Mezzanine"));
  });
});
