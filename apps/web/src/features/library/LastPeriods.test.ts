import { describe, expect, test } from "vite-plus/test";
import { lastMonths, lastWeeks, lastYears } from "./LastPeriods.tsx";

const now = new Date(Date.UTC(2026, 10, 20));

describe("last periods", () => {
  test("12 months, empty ones included, ending this month", () => {
    const bars = lastMonths(
      [
        { period: "2026-11", listenCount: 5 },
        { period: "2026-01", listenCount: 2 },
      ],
      now,
    );
    expect(bars).toHaveLength(12);
    expect(bars[0]!.key).toBe("2025-12");
    expect(bars.at(-1)).toMatchObject({ key: "2026-11", count: 5 });
    expect(bars.find((b) => b.key === "2026-01")!.count).toBe(2);
    expect(bars.filter((b) => b.count === 0)).toHaveLength(10);
  });
  test("weeks by Monday", () => {
    const bars = lastWeeks([{ period: "2026-11-16", listenCount: 3 }], now);
    expect(bars.at(-1)).toMatchObject({ key: "2026-11-16", count: 3 });
  });
  test("years from the first listen", () => {
    expect(lastYears([{ period: "2024", listenCount: 1 }], now).map((b) => b.key)).toEqual([
      "2024",
      "2025",
      "2026",
    ]);
  });
});
