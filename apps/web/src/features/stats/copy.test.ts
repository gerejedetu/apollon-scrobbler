import { describe, expect, test } from "vite-plus/test";
import { isOngoing, previousLabel, rangeSentence, weekdayName } from "./copy.ts";
import { remainingDays } from "./Daily.tsx";

describe("stats copy", () => {
  test("period sentences", () => {
    expect(rangeSentence("this_month")).toBe("Ce mois-ci");
    expect(rangeSentence("all_time")).toBe("Depuis le début");
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
