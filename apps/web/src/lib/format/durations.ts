/** Durations: "71 h", "1 h 12", "6 h 40", "41 jours" / "41 days". */
import { m } from "../../paraglide/messages.js";
import { formatCount } from "./numbers.ts";

export const formatHours = (ms: number) =>
  m.unit_hours({ count: formatCount(Math.round(ms / 3_600_000)) });

export function formatDuration(seconds: number): string {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const min = total % 60;
  if (h === 0) return m.unit_minutes({ count: min });
  return min === 0
    ? m.unit_hours_plain({ count: h })
    : m.unit_hours_minutes({ hours: h, minutes: String(min).padStart(2, "0") });
}

export const formatDays = (n: number) =>
  n > 1 ? m.unit_days({ count: formatCount(n) }) : m.unit_day({ count: n });
