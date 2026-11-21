import { describe, expect, test } from "vite-plus/test";
import { creditParts } from "./TrackLinks.tsx";

describe("creditParts", () => {
  test("keeps a single artist whole", () => {
    expect(creditParts("Radiohead")).toEqual([{ text: "Radiohead", artist: "Radiohead" }]);
  });
  test("links each credited artist and keeps the separators", () => {
    expect(creditParts("Sickboyrari & Krisu")).toEqual([
      { text: "Sickboyrari", artist: "Sickboyrari" },
      { text: " & " },
      { text: "Krisu", artist: "Krisu" },
    ]);
  });
  test("handles featurings", () => {
    const parts = creditParts("Peso Pluma feat. Estevan Plazola");
    expect(parts.filter((p) => p.artist).map((p) => p.artist)).toEqual([
      "Peso Pluma",
      "Estevan Plazola",
    ]);
    expect(parts.map((p) => p.text).join("")).toBe("Peso Pluma feat. Estevan Plazola");
  });
});
