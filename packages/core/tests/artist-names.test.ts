import { describe, expect, test } from "vite-plus/test";
import { bilingualParts, canonicalArtist } from "../src/index.ts";

describe("bilingual artist names", () => {
  test("native + Latin halves, in either order or with parentheses", () => {
    expect(bilingualParts("헤이즈 Heize")).toEqual({ native: "헤이즈", latin: "Heize" });
    expect(bilingualParts("Heize 헤이즈")).toEqual({ native: "헤이즈", latin: "Heize" });
    expect(bilingualParts("엄지 (UMJI)")).toEqual({ native: "엄지", latin: "UMJI" });
    expect(bilingualParts("BTS (방탄소년단)")).toEqual({ native: "방탄소년단", latin: "BTS" });
    expect(bilingualParts("소녀시대 Girls' Generation")).toEqual({
      native: "소녀시대",
      latin: "Girls' Generation",
    });
  });

  test("ordinary names are left alone", () => {
    for (const name of [
      "Heize",
      "헤이즈",
      "BLACKPINK",
      "Peso Pluma & Estevan Plazola",
      "Sigur Rós",
      "Artist (Live)",
      "IU (아이유) & Friends 친구",
    ]) {
      expect(bilingualParts(name), name).toBeNull();
    }
  });

  test("the library's existing form wins, else the Latin half; the other forms are learned", () => {
    expect(canonicalArtist("헤이즈 Heize", new Set(["Heize"]), new Map())).toEqual({
      artist: "Heize",
      learn: [
        ["헤이즈 Heize", "Heize"],
        ["헤이즈", "Heize"],
      ],
    });
    expect(canonicalArtist("헤이즈 Heize", new Set(["헤이즈"]), new Map()).artist).toBe("헤이즈");
    expect(canonicalArtist("헤이즈 Heize", new Set(), new Map()).artist).toBe("Heize");
    // A form the library already uses as is stays as is.
    expect(canonicalArtist("엄지 (UMJI)", new Set(["엄지 (UMJI)"]), new Map()).artist).toBe(
      "엄지 (UMJI)",
    );
    // A learned alias applies to names that are not bilingual themselves.
    expect(canonicalArtist("헤이즈", new Set(), new Map([["헤이즈", "Heize"]])).artist).toBe(
      "Heize",
    );
    expect(canonicalArtist("Air", new Set(), new Map())).toEqual({ artist: "Air", learn: [] });
  });
});

describe("service labels", () => {
  test("a YouTube Music type label is not part of the artist's name", async () => {
    const { withoutServiceLabel } = await import("../src/index.ts");
    expect(withoutServiceLabel("Song • STAYC")).toBe("STAYC");
    expect(withoutServiceLabel("Video • Heize")).toBe("Heize");
    expect(withoutServiceLabel("Titre · Angèle")).toBe("Angèle");
    expect(withoutServiceLabel("STAYC")).toBe("STAYC");
    expect(withoutServiceLabel("Songhoy Blues")).toBe("Songhoy Blues");
    expect(withoutServiceLabel("Song •")).toBe("Song •");
  });
});
