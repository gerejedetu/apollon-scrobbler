import { css } from "styled-system/css";
import type { Activity, Range } from "../../api/index.ts";
import { formatCount, formatDayString, formatWeekday, parseDay } from "../../lib/format/index.ts";
import { AxisLabels, Bars, type Bar } from "../../ui/charts/index.ts";
import { displayHeading } from "../../ui/primitives/index.ts";
import { isOngoing } from "./copy.ts";
import { color } from "../../ui/theme/index.ts";

/** Days still to come in the current week, month or year (empty slots after today). */
export function remainingDays(range: Range, lastDay: string): string[] {
  if (!isOngoing(range)) return [];
  const last = parseDay(lastDay);
  const end = new Date(last);
  if (range === "this_week")
    end.setUTCDate(last.getUTCDate() + (7 - ((last.getUTCDay() + 6) % 7) - 1));
  if (range === "this_month") end.setUTCMonth(last.getUTCMonth() + 1, 0);
  if (range === "this_year") end.setUTCMonth(11, 31);
  const out: string[] = [];
  for (const d = new Date(last); d < end;) {
    d.setUTCDate(d.getUTCDate() + 1);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** "Jour après jour": one bar per day, the busiest tagged, today violet. */
export function Daily({ activity, range }: { activity: Activity; range: Range }) {
  const days = activity.days ?? [];
  if (days.length === 0) return null;
  const today = days.at(-1)!;
  const future = range === "this_year" ? [] : remainingDays(range, today.date);
  const peak = days.reduce((best, d) => (d.listenCount > best.listenCount ? d : best), days[0]!);
  const bars: Bar[] = [
    ...days.map((d) => ({
      value: d.listenCount,
      color:
        isOngoing(range) && d === today
          ? color("violet")
          : d === peak && peak.listenCount > 0
            ? color("ink")
            : color("yellow"),
      label: `${formatDayString(d.date)} : ${formatCount(d.listenCount)}`,
      tag:
        d === peak && peak.listenCount > 0
          ? `${formatWeekday(d.date)} ${parseDay(d.date).getUTCDate()} · ${d.listenCount}`
          : undefined,
    })),
    ...future.map(() => ({ value: 0, pending: true })),
  ];
  const first = days[0]!;
  const lastLabel = future.length ? formatDayString(future.at(-1)!) : formatDayString(today.date);
  return (
    <section className={css({ display: "flex", flexDirection: "column", gap: "16px" })}>
      <h2 className={displayHeading.serif}>Jour après jour</h2>
      <Bars
        bars={bars}
        height={220}
        gap={bars.length > 60 ? 1 : 4}
        topPadding={36}
        baseline="1px solid var(--colors-ink)"
        label="Écoutes par jour"
      />
      <AxisLabels
        items={[
          formatDayString(first.date),
          ...(isOngoing(range) && future.length
            ? [
                <span key="t" className={css({ color: "violet", fontWeight: "600" })}>
                  aujourd'hui
                </span>,
              ]
            : []),
          lastLabel,
        ]}
      />
    </section>
  );
}
