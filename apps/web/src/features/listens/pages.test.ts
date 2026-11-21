import { describe, expect, test } from "vite-plus/test";
import { olderCursor, parseHistorySearch } from "./pages.ts";

const listen = (t: number) => ({
  id: String(t),
  listenedAt: t,
  insertedAt: t,
  artist: "a",
  track: "t",
});

describe("history paging", () => {
  test("search params", () => {
    expect(parseHistorySearch({ avant: "100" })).toEqual({ avant: 100 });
    expect(parseHistorySearch({ avant: "x" })).toEqual({ avant: undefined });
  });

  test("older cursor", () => {
    expect(olderCursor({ listens: [listen(30), listen(20)], oldestListenedAt: 10 })).toBe(20);
    expect(olderCursor({ listens: [listen(30), listen(10)], oldestListenedAt: 10 })).toBeNull();
    expect(olderCursor({ listens: [], oldestListenedAt: null })).toBeNull();
  });
});
