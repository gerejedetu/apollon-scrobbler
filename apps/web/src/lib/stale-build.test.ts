import { describe, expect, test } from "vite-plus/test";
import { isStaleBuildError } from "./stale-build.ts";

describe("isStaleBuildError", () => {
  test("recognises the chunk errors of the main browsers", () => {
    for (const message of [
      "Failed to fetch dynamically imported module: https://x/assets/route-abc.js",
      "Importing a module script failed.",
      "error loading dynamically imported module: https://x/assets/a.js",
    ]) {
      expect(isStaleBuildError(new TypeError(message))).toBe(true);
    }
  });
  test("leaves other errors alone", () => {
    expect(isStaleBuildError(new Error("No listens"))).toBe(false);
    expect(isStaleBuildError("Failed to fetch dynamically imported module")).toBe(false);
  });
});
