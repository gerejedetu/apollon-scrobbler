import { describe, expect, test } from "vite-plus/test";
import { canonicalAlbum, editionBase, hasEditionMarker, withoutAdvisory } from "../src/index.ts";

describe("album editions", () => {
  test("content advisories are never a different album", () => {
    expect(withoutAdvisory("Midnights [Clean]")).toBe("Midnights");
    expect(withoutAdvisory("Midnights (Explicit)")).toBe("Midnights");
    expect(withoutAdvisory("Midnights - Clean Version")).toBe("Midnights");
    expect(withoutAdvisory("Clean Bandit")).toBe("Clean Bandit");
    expect(canonicalAlbum("Midnights [Clean]", new Set())).toBe("Midnights");
  });

  test("an edition joins the plain album only when the library has it", () => {
    expect(editionBase("Good Riddance (Deluxe)")).toBe("Good Riddance");
    expect(editionBase("Abbey Road (Remastered 2019)")).toBe("Abbey Road");
    expect(editionBase("Positions (Deluxe Bonus Videos Edition)")).toBe("Positions");
    expect(editionBase("Midnights - Deluxe")).toBe("Midnights");
    expect(canonicalAlbum("Good Riddance (Deluxe)", new Set(["Good Riddance"]))).toBe(
      "Good Riddance",
    );
    expect(canonicalAlbum("Good Riddance (Deluxe)", new Set())).toBe("Good Riddance (Deluxe)");
    expect(canonicalAlbum("Midnights (3am Edition) [Explicit]", new Set(["Midnights"]))).toBe(
      "Midnights",
    );
  });

  test("ordinary titles carry no marker (no lookup)", () => {
    for (const t of ["Midnights", "1989 (Taylor's Version)", "The Edition", "Version Française"]) {
      expect(hasEditionMarker(t) && editionBase(t) === t && withoutAdvisory(t) === t, t).toBe(
        false,
      );
    }
  });
});
