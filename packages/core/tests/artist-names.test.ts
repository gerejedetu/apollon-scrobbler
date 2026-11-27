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

describe("spellings of one artist", () => {
  test("case, apostrophes, periods, dashes and spaces do not make another artist", async () => {
    const { artistKey } = await import("../src/index.ts");
    const key = artistKey("Despo Rutti");
    for (const n of [
      "Despo' Rutti",
      "Despo’ Rutti",
      "despo rutti",
      "DESPO RUTTI",
      "Despo  Rutti",
      "Despo`Rutti",
      "Despo-Rutti",
      "Despo. Rutti",
    ])
      expect(artistKey(n), n).toBe(key);
    expect(artistKey("GFRIEND")).toBe(artistKey("gfriend"));
    expect(artistKey("Ｇｆｒｉｅｎｄ")).toBe(artistKey("GFRIEND"));
  });

  test("other differences still count", async () => {
    const { artistKey } = await import("../src/index.ts");
    expect(artistKey("Beyoncé")).not.toBe(artistKey("Beyonce"));
    expect(artistKey("AC/DC")).not.toBe(artistKey("ACDC"));
    expect(artistKey("Florence + The Machine")).not.toBe(artistKey("Florence The Machine"));
    expect(artistKey("여자친구")).not.toBe(artistKey("GFRIEND"));
    expect(artistKey("!!!")).toBe("!!!");
    expect(artistKey("...")).toBe("...");
  });
});

describe("native names in album titles", () => {
  test("an album titled after the native name, as a whole word", async () => {
    const { albumNamedAfter, isLatinOnly, isNativeOnly } = await import("../src/index.ts");
    expect(albumNamedAfter("여자친구 The 7th Mini Album 'FEVER SEASON'", "여자친구")).toBe(true);
    expect(albumNamedAfter("여자친구", "여자친구")).toBe(true);
    expect(albumNamedAfter("여자친구들의 노래", "여자친구")).toBe(false);
    expect(albumNamedAfter("回:Walpurgis Night", "回")).toBe(false);
    expect(albumNamedAfter("Season Of Glass", "여자친구")).toBe(false);
    expect(isNativeOnly("여자친구")).toBe(true);
    expect(isNativeOnly("헤이즈 Heize")).toBe(false);
    expect(isLatinOnly("GFRIEND")).toBe(true);
    expect(isLatinOnly("Despo' Rutti")).toBe(true);
    expect(isLatinOnly("헤이즈 Heize")).toBe(false);
  });
});

describe("title in the artist field", () => {
  test("the title repeated in the artist field, or the artist in the title, is dropped", async () => {
    const { untangleTitle } = await import("../src/index.ts");
    const track = "유리구슬 (Glass Bead)";
    expect(untangleTitle("gfriend : 유리구슬 (Glass Bead)", track)).toEqual({
      artist: "gfriend",
      track,
    });
    expect(untangleTitle("GFRIEND - 유리구슬 (Glass Bead)", track)).toEqual({
      artist: "GFRIEND",
      track,
    });
    expect(untangleTitle("GFRIEND", "GFRIEND - 유리구슬 (Glass Bead)")).toEqual({
      artist: "GFRIEND",
      track,
    });
    expect(untangleTitle("Gfriend", "GFRIEND : 유리구슬 (Glass Bead)")).toEqual({
      artist: "Gfriend",
      track,
    });
  });

  test("names that only contain a separator are kept", async () => {
    const { untangleTitle } = await import("../src/index.ts");
    for (const [artist, track] of [
      ["Sexion d'Assaut - Live", "Wati House"],
      ["Run - DMC", "Walk This Way"],
      ["Heize", "Intro : Heize"],
      ["Despo Rutti", "Traffic de stéréotypes"],
      ["The Weeknd", "Blinding Lights - Remix"],
    ] as const)
      expect(untangleTitle(artist, track)).toEqual({ artist, track });
  });
});
