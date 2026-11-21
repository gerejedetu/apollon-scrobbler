/** Words of the stats page that depend on the data. Pure, so they are tested on their own. */
import type { Range } from "../../api/index.ts";
import { dateFormat } from "../../lib/locale.ts";
import { m } from "../../paraglide/messages.js";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** The API's weekday ("saturday", or "sat") in the interface language: "samedi" / "Saturday". */
export function weekdayName(day: string): string {
  const i = WEEKDAYS.findIndex((w) => w.startsWith(day.toLowerCase().slice(0, 3)));
  if (i < 0) return day;
  // 2024-01-01 was a Monday.
  return dateFormat({ weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 1 + i)),
  );
}

const SENTENCES: Record<Range, () => string> = {
  this_week: m.sentence_this_week,
  this_month: m.sentence_this_month,
  this_year: m.sentence_this_year,
  week: m.sentence_week,
  month: m.sentence_month,
  quarter: m.sentence_quarter,
  half_yearly: m.sentence_half_yearly,
  year: m.sentence_year,
  all_time: m.sentence_all_time,
};

/** The period in a sentence: "Ce mois-ci, tu as écouté…". */
export const rangeSentence = (range: Range) => SENTENCES[range]();

/** Ranges that run to now: the remaining days of the period are drawn as empty slots. */
export const isOngoing = (range: Range) => range.startsWith("this_");
