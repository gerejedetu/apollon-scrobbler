import { describe, expect, test } from "vite-plus/test";
import { ApiError, parseRange, rangeWindow } from "../src/index.ts";

const ts = (iso: string) => Date.parse(iso) / 1000;
// Thursday 2026-11-19 15:00 UTC
const NOW = ts("2026-11-19T15:00:00Z");

describe("stats ranges", () => {
  test("parseRange defaults to all_time and rejects unknown values", () => {
    expect(parseRange(undefined)).toBe("all_time");
    expect(parseRange("month")).toBe("month");
    expect(() => parseRange("decade")).toThrow(ApiError);
  });

  test.each([
    ["all_time", "1970-01-01T00:00:00Z", null],
    ["this_week", "2026-11-16T00:00:00Z", null],
    ["this_month", "2026-11-01T00:00:00Z", null],
    ["this_year", "2026-01-01T00:00:00Z", null],
    ["week", "2026-11-09T00:00:00Z", "2026-11-15T23:59:59Z"],
    ["month", "2026-10-01T00:00:00Z", "2026-10-31T23:59:59Z"],
    ["quarter", "2026-07-01T00:00:00Z", "2026-09-30T23:59:59Z"],
    ["half_yearly", "2026-01-01T00:00:00Z", "2026-06-30T23:59:59Z"],
    ["year", "2025-01-01T00:00:00Z", "2025-12-31T23:59:59Z"],
  ] as const)("%s", (range, from, to) => {
    expect(rangeWindow(range, NOW)).toEqual({ fromTs: ts(from), toTs: to ? ts(to) : NOW });
  });

  test("previous month/quarter wrap across years", () => {
    const jan = ts("2026-01-10T00:00:00Z");
    expect(rangeWindow("month", jan)).toEqual({
      fromTs: ts("2025-12-01T00:00:00Z"),
      toTs: ts("2025-12-31T23:59:59Z"),
    });
    expect(rangeWindow("quarter", jan)).toEqual({
      fromTs: ts("2025-10-01T00:00:00Z"),
      toTs: ts("2025-12-31T23:59:59Z"),
    });
    expect(rangeWindow("half_yearly", jan)).toEqual({
      fromTs: ts("2025-07-01T00:00:00Z"),
      toTs: ts("2025-12-31T23:59:59Z"),
    });
  });

  test("this_week on a Monday starts that day; on a Sunday starts six days before", () => {
    expect(rangeWindow("this_week", ts("2026-11-16T08:00:00Z")).fromTs).toBe(
      ts("2026-11-16T00:00:00Z"),
    );
    expect(rangeWindow("this_week", ts("2026-11-22T23:00:00Z")).fromTs).toBe(
      ts("2026-11-16T00:00:00Z"),
    );
  });
});
