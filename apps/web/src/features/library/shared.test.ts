import { describe, expect, test } from "vite-plus/test";
import { fillMonths, recordOf } from "./shared.tsx";

describe("monthly series", () => {
  test("gaps become zero months, across years", () => {
    const filled = fillMonths([
      { period: "2025-11", listenCount: 3 },
      { period: "2026-02", listenCount: 5 },
    ]);
    expect(filled.map((p) => p.period)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(filled.map((p) => p.listenCount)).toEqual([3, 0, 0, 5]);
  });
  test("record month", () => {
    expect(
      recordOf([
        { period: "a", listenCount: 1 },
        { period: "b", listenCount: 9 },
      ])?.period,
    ).toBe("b");
    expect(recordOf([])).toBeNull();
  });
});
