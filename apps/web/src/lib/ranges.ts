/** The API's ranges, labelled. `this_*` run to now; the others are the last complete period. */
import type { Range } from "../api/index.ts";

export const RANGES: { value: Range; label: string }[] = [
  { value: "this_week", label: "Cette semaine" },
  { value: "this_month", label: "Ce mois-ci" },
  { value: "this_year", label: "Cette année" },
  { value: "week", label: "Semaine passée" },
  { value: "month", label: "Mois passé" },
  { value: "quarter", label: "Trimestre passé" },
  { value: "half_yearly", label: "Semestre passé" },
  { value: "year", label: "Année passée" },
  { value: "all_time", label: "Depuis toujours" },
];

/** The ranges in the period menu, grouped like the design: current periods, past periods, all time. */
export const RANGE_OPTIONS: { value: Range; label: string; separated?: boolean }[] = RANGES.map(
  (r) => ({
    ...r,
    separated: r.value === "week" || r.value === "all_time",
  }),
);

export const rangeLabel = (range: Range) => RANGES.find((r) => r.value === range)?.label ?? range;

export function isRange(value: unknown): value is Range {
  return typeof value === "string" && RANGES.some((r) => r.value === value);
}

/** A non-empty string search parameter, or undefined. */
export const textParam = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;
