import { describe, expect, test } from "vite-plus/test";
import {
  canonicalAlbum,
  editionBase,
  hasEditionMarker,
  withoutAdvisory,
  withoutStoreSuffixes,
} from "../src/index.ts";

describe("album editions", () => {
  test("content advisories are never a different album", () => {
    expect(withoutAdvisory("Midnights [Clean]")).toBe("Midnights");
    expect(withoutAdvisory("Midnights (Explicit)")).toBe("Midnights");
    expect(withoutAdvisory("Midnights - Clean Version")).toBe("Midnights");
    expect(withoutAdvisory("Clean Bandit")).toBe("Clean Bandit");
    expect(canonicalAlbum("Midnights [Clean]", new Set())).toBe("Midnights");
  });

  test("release-type store suffixes are never part of the title", () => {
    for (const t of [
      "Love, Yerin - EP",
      "Love, Yerin - ep",
      "Love, Yerin (EP)",
      "Love, Yerin [EP]",
      "Love, Yerin – EP",
      "Love, Yerin - Single",
      "Love, Yerin (Single)",
      "Love, Yerin [single]",
      "Love, Yerin - EP [Explicit]",
      "Love, Yerin (Explicit) - Single",
    ])
      expect(withoutStoreSuffixes(t), t).toBe("Love, Yerin");
    expect(canonicalAlbum("Love, Yerin - EP", new Set())).toBe("Love, Yerin");
    expect(canonicalAlbum("Lover (Deluxe) - EP", new Set(["Lover"]))).toBe("Lover");
  });

  test("EP and Single stay when they are the title or inside it", () => {
    for (const t of [
      "Single",
      "EP",
      "(Single)",
      "Single Ladies",
      "The EP Collection",
      "Singles",
      "Mini-EP",
      "Not Another Single-EP",
      "EP1",
    ]) {
      expect(withoutStoreSuffixes(t), t).toBe(t);
      expect(canonicalAlbum(t, new Set()), t).toBe(t);
    }
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
    for (const t of [
      "Midnights",
      "1989 (Taylor's Version)",
      "The Edition",
      "Version Française",
      "Single Ladies",
      "EP",
    ]) {
      expect(hasEditionMarker(t) && editionBase(t) === t && withoutAdvisory(t) === t, t).toBe(
        false,
      );
    }
  });
});
