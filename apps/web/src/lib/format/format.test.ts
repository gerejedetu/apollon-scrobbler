import { describe, expect, test } from "vite-plus/test";
import {
  barWidth,
  formatAgo,
  formatChange,
  formatCompact,
  formatCount,
  formatDays,
  formatDuration,
  formatHours,
  formatShare,
} from "./index.ts";

const nb = " ";

describe("numbers", () => {
  test("thousands use a no-break space", () => {
    expect(formatCount(1204)).toBe(`1${nb}204`);
    expect(formatCount(39812)).toBe(`39${nb}812`);
  });
  test("compact from 100 000", () => {
    expect(formatCompact(4318)).toBe(`4${nb}318`);
    expect(formatCompact(142908)).toBe("142k");
    expect(formatCompact(2_500_000)).toBe("2,5M");
  });
  test("shares and changes", () => {
    expect(formatShare(0.073)).toBe(`7,3${nb}%`);
    expect(formatChange(12)).toBe(`+12${nb}%`);
    expect(formatChange(-3.2)).toBe(`−3${nb}%`);
    expect(formatChange(0)).toBe(`0${nb}%`);
  });
  test("bar widths", () => {
    expect(barWidth(48, 96)).toBe("50%");
    expect(barWidth(1, 0)).toBe("0%");
  });
});

describe("durations", () => {
  test("hours and minutes", () => {
    expect(formatHours(71 * 3_600_000)).toBe(`71${nb}h`);
    expect(formatDuration(72 * 60)).toBe("1 h 12");
    expect(formatDuration(6 * 3600)).toBe("6 h");
    expect(formatDuration(25 * 60)).toBe("25 min");
    expect(formatDays(1)).toBe("1 jour");
    expect(formatDays(41)).toBe("41 jours");
  });
});

describe("formatAgo", () => {
  const now = 1_790_000_000;
  test("steps", () => {
    expect(formatAgo(now - 10, now)).toBe("à l'instant");
    expect(formatAgo(now - 6 * 60, now)).toBe("il y a 6 min");
    expect(formatAgo(now - 3 * 3600, now)).toBe("il y a 3 h");
    expect(formatAgo(now - 30 * 3600, now)).toBe("hier");
    expect(formatAgo(now - 4 * 86400, now)).toBe("il y a 4 j");
  });
});
