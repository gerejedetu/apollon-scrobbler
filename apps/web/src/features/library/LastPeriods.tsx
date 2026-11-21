import { css } from "styled-system/css";
import { formatCount } from "../../lib/format/index.ts";
import { color } from "../../ui/theme/index.ts";
import { dateFormat } from "../../lib/locale.ts";
import { m } from "../../paraglide/messages.js";

export interface PeriodBar {
  key: string;
  label: string;
  count: number;
  tip: string;
}

/**
 * A fixed number of periods (the last 12 months, weeks or years), empty ones included: the count above
 * each bar, the label under it, the current period in violet (board "Artiste", "Au fil du temps").
 */
export function LastPeriods({ bars, height = 160 }: { bars: PeriodBar[]; height?: number }) {
  const max = Math.max(1, ...bars.map((b) => b.count));
  const columns = { gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` };
  const last = bars.length - 1;
  return (
    <>
      <div
        role="img"
        aria-label={bars.map((b) => b.tip).join(", ")}
        className={css({
          display: "grid",
          gap: "6px",
          alignItems: "end",
          borderBottom: "1px solid token(colors.rule)",
        })}
        style={{ ...columns, height }}
      >
        {bars.map((b, i) => (
          <div
            key={b.key}
            title={b.tip}
            className={css({
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "6px",
            })}
          >
            <span
              className={css({ fontSize: "11px", fontWeight: "500" })}
              style={{ color: i === last ? color("violet") : color("ink") }}
            >
              {b.count ? formatCount(b.count) : ""}
            </span>
            <div
              className={css({ width: "100%", maxWidth: "40px", minHeight: "2px" })}
              style={{
                height: b.count ? `${Math.max(4, Math.round((b.count / max) * 100))}%` : 2,
                background: b.count
                  ? i === last
                    ? color("violet")
                    : color("yellow")
                  : color("dashed"),
              }}
            />
          </div>
        ))}
      </div>
      <div
        className={css({ display: "grid", gap: "6px", fontSize: "11px", textAlign: "center" })}
        style={columns}
      >
        {bars.map((b, i) => (
          <span key={b.key} style={{ color: i === last ? color("violet") : color("muted") }}>
            {b.label}
          </span>
        ))}
      </div>
    </>
  );
}

const shortMonth = {
  format: (d: Date) => dateFormat({ month: "short", timeZone: "UTC" }).format(d),
};

/** The last 12 months up to `now` (local), filled from "YYYY-MM" periods. */
export function lastMonths(
  periods: { period: string; listenCount: number }[],
  now: Date,
  n = 12,
): PeriodBar[] {
  const counts = new Map(periods.map((p) => [p.period.slice(0, 7), p.listenCount]));
  const out: PeriodBar[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    const count = counts.get(key) ?? 0;
    const label = shortMonth.format(d);
    out.push({
      key,
      label,
      count,
      tip: m.date_listens({ date: `${label} ${d.getUTCFullYear()}`, count }),
    });
  }
  return out;
}

/** The last 12 weeks (labelled by their Monday, as the API does). */
export function lastWeeks(
  periods: { period: string; listenCount: number }[],
  now: Date,
  n = 12,
): PeriodBar[] {
  const counts = new Map(periods.map((p) => [p.period.slice(0, 10), p.listenCount]));
  const monday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - ((now.getUTCDay() + 6) % 7),
    ),
  );
  const out: PeriodBar[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(monday.getTime() - i * 7 * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const count = counts.get(key) ?? 0;
    const label = `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
    out.push({ key, label, count, tip: m.week_listens({ date: label, count }) });
  }
  return out;
}

/** Every year from the first one with listens (at most 12) to now. */
export function lastYears(
  periods: { period: string; listenCount: number }[],
  now: Date,
  n = 12,
): PeriodBar[] {
  const counts = new Map(periods.map((p) => [p.period.slice(0, 4), p.listenCount]));
  const first = Math.min(now.getUTCFullYear(), ...[...counts.keys()].map(Number));
  const from = Math.max(first, now.getUTCFullYear() - n + 1);
  const out: PeriodBar[] = [];
  for (let y = from; y <= now.getUTCFullYear(); y++) {
    const count = counts.get(String(y)) ?? 0;
    out.push({
      key: String(y),
      label: String(y),
      count,
      tip: m.date_listens({ date: String(y), count }),
    });
  }
  return out;
}
