import { describe, expect, test } from "vite-plus/test";
import { dayPart, isOngoing, previousLabel, shareBetween, weekdayName } from "./copy.ts";
import { remainingDays } from "./Daily.tsx";

describe("stats copy", () => {
  test("day parts", () => {
    expect(dayPart(22).title).toBe("Tu es du soir.");
    expect(dayPart(8).title).toBe("Tu es du matin.");
    expect(dayPart(2).title).toBe("Tu es de la nuit.");
    expect(dayPart(15).title).toBe("Tu es de l'après-midi.");
  });
  test("share of a window", () => {
    const hours = Array.from({ length: 24 }, (_, h) => (h >= 20 ? 10 : 0));
    hours[0] = 40;
    expect(shareBetween(hours, 20, 24)).toBe(0.5);
    expect(shareBetween(Array(24).fill(0), 0, 4)).toBe(0);
  });
  test("weekdays and periods", () => {
    expect(weekdayName("saturday")).toBe("samedi");
    expect(previousLabel("this_month")).toBe("le mois dernier");
    expect(isOngoing("this_week")).toBe(true);
    expect(isOngoing("month")).toBe(false);
  });
  test("days left in the current period", () => {
    expect(remainingDays("this_month", "2026-11-20")).toHaveLength(10);
    expect(remainingDays("this_month", "2026-11-30")).toEqual([]);
    // Thursday 19 November 2026: Friday to Sunday remain.
    expect(remainingDays("this_week", "2026-11-19")).toEqual([
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
    expect(remainingDays("month", "2026-10-31")).toEqual([]);
  });
});
