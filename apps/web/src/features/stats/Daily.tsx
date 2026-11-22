import { css } from "styled-system/css";
import type { Activity, Range } from "../../api/index.ts";
import { formatCount, formatDayString, parseDay } from "../../lib/format/index.ts";
import { AxisLabels } from "../../ui/charts/index.ts";
import { isOngoing } from "./copy.ts";
import { color } from "../../ui/theme/index.ts";
import { m } from "../../paraglide/messages.js";
import { sectionTitle } from "../../ui/primitives/index.ts";

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

/** "Écoutes par jour": a bar per day, today violet, days still to come as thin grey stubs. */
export function Daily({ activity, range }: { activity: Activity; range: Range }) {
  const days = activity.days ?? [];
  if (days.length === 0) return null;
  const today = days.at(-1)!;
  const future = remainingDays(range, today.date);
  const peak = days.reduce((best, d) => (d.listenCount > best.listenCount ? d : best), days[0]!);
  const max = Math.max(1, peak.listenCount);
  const all = [...days.map((d) => d.date), ...future];
  const label = (date: string) => formatDayString(date);
  return (
    <section className={css({ display: "flex", flexDirection: "column", gap: "12px" })}>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "12px",
        })}
      >
        <h2 className={sectionTitle}>{m.listens_per_day()}</h2>
        {peak.listenCount > 0 ? (
          <span className={css({ fontSize: "12px", color: "muted" })}>
            {m.record_label()}{" "}
            <b className={css({ color: "ink", fontWeight: "500" })}>
              {formatCount(peak.listenCount)}
            </b>{" "}
            {m.on_date({ date: label(peak.date) })}
          </span>
        ) : null}
      </div>
      <div
        role="img"
        aria-label={m.listens_per_day_aria({ count: peak.listenCount, date: label(peak.date) })}
        className={css({
          height: "120px",
          display: "flex",
          alignItems: "flex-end",
          borderBottom: "1px solid token(colors.rule)",
        })}
        style={{ gap: all.length > 60 ? 1 : 4 }}
      >
        {days.map((d) => (
          <div
            key={d.date}
            title={m.date_listens({ date: label(d.date), count: formatCount(d.listenCount) })}
            className={css({ flex: 1, minHeight: "2px" })}
            style={{
              height: `${Math.round((d.listenCount / max) * 100)}%`,
              background: isOngoing(range) && d === today ? color("violet") : color("yellow"),
            }}
          />
        ))}
        {future.map((date) => (
          <div key={date} className={css({ flex: 1, height: "2px", bg: "rule" })} />
        ))}
      </div>
      <AxisLabels
        items={[label(all[0]!), label(all[Math.floor(all.length / 2)]!), label(all.at(-1)!)]}
      />
    </section>
  );
}
