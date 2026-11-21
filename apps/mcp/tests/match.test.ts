import { describe, expect, test } from "vite-plus/test";
import { normalize, rank, score } from "../src/search/match.ts";

describe("search matching", () => {
  test("ignores case, accents and punctuation", () => {
    expect(normalize("Beyoncé — Déjà Vu!")).toBe("beyonce deja vu");
    expect(normalize("  AC/DC  ")).toBe("ac dc");
  });

  test("exact beats prefix beats words anywhere; no match is 0", () => {
    expect(score("daft punk", "Daft Punk")).toBe(3);
    expect(score("daft", "Daft Punk")).toBe(2);
    expect(score("punk", "Daft Punk")).toBe(1);
    expect(score("lucky daft", "Get Lucky", "Daft Punk")).toBe(1);
    expect(score("justice", "Daft Punk")).toBe(0);
    expect(score("  ", "Daft Punk")).toBe(0);
  });

  test("ranks by match quality, then by listens, and keeps the best ones", () => {
    const items = [
      { name: "Punk Rock", listenCount: 50 },
      { name: "Daft Punk", listenCount: 10 },
      { name: "Punk", listenCount: 1 },
      { name: "Jazz", listenCount: 99 },
    ];
    expect(rank("punk", items, 10).map((i) => i.name)).toEqual(["Punk", "Punk Rock", "Daft Punk"]);
    expect(rank("punk", items, 1)).toHaveLength(1);
  });
});
