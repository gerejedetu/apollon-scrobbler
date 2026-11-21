/** The API's ranges, labelled. `this_*` run to now; the others are the last complete period. */
import type { Range } from "../api/index.ts";
import { m } from "../paraglide/messages.js";

const LABELS: Record<Range, () => string> = {
  this_week: m.range_this_week,
  this_month: m.range_this_month,
  this_year: m.range_this_year,
  week: m.range_week,
  month: m.range_month,
  quarter: m.range_quarter,
  half_yearly: m.range_half_yearly,
  year: m.range_year,
  all_time: m.range_all_time,
};

export const RANGE_VALUES = Object.keys(LABELS) as Range[];

export const rangeLabel = (range: Range) => LABELS[range]();

/** The period menu, grouped like the design: current periods, past periods, all time. */
export const rangeOptions = (): { value: Range; label: string; separated?: boolean }[] =>
  RANGE_VALUES.map((value) => ({
    value,
    label: rangeLabel(value),
    separated: value === "week" || value === "all_time",
  }));

export function isRange(value: unknown): value is Range {
  return typeof value === "string" && value in LABELS;
}

/** A non-empty string search parameter, or undefined. */
export const textParam = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;
