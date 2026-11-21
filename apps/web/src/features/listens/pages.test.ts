import { describe, expect, test } from "vite-plus/test";
import { neighbours, pageNumbers, pageRange, parseHistorySearch } from "./pages.ts";

const listen = (t: number) => ({
  id: String(t),
  listenedAt: t,
  insertedAt: t,
  artist: "a",
  track: "t",
});

describe("history paging", () => {
  test("search params", () => {
    expect(parseHistorySearch({ avant: "100", page: "2", taille: "25" })).toEqual({
      avant: 100,
      apres: undefined,
      page: 2,
      taille: 25,
    });
    expect(parseHistorySearch({ taille: "7", page: "x" })).toEqual({
      avant: undefined,
      apres: undefined,
      page: undefined,
      taille: undefined,
    });
  });

  test("next and previous pages", () => {
    const page = {
      userName: "u",
      count: 2,
      listens: [listen(200), listen(150)],
      oldestListenedAt: 10,
      latestListenedAt: 300,
      next: 150,
    };
    expect(neighbours(page, {}, 50)).toEqual({
      older: { avant: 150, page: undefined, taille: 50 },
      newer: null,
    });
    expect(neighbours(page, { avant: 250, page: 2 }, 50)).toEqual({
      older: { avant: 150, page: 3, taille: 50 },
      newer: { apres: 200, page: 1, taille: 50 },
    });
    expect(neighbours({ ...page, oldestListenedAt: 150 }, { page: 1 }, 50).older).toBeNull();
  });

  test("labels", () => {
    expect(pageRange(2, 50, 50)).toBe("51–100");
    expect(pageRange(undefined, 50, 50)).toBeNull();
    expect(pageNumbers(1, 2859)).toEqual([1, 2, null, 2859]);
    expect(pageNumbers(5, 9)).toEqual([1, null, 4, 5, 6, null, 9]);
    expect(pageNumbers(1, 1)).toEqual([1]);
  });
});
