import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { formatCount, formatPeriodMonth } from "../../lib/format/index.ts";
import { AxisLabels, Bars } from "../../ui/charts/index.ts";
import { Caps } from "../../ui/primitives/index.ts";

/** "ARTISTE / Radiohead" title block of the library pages. */
export function EntityTitle({
  kind,
  title,
  sub,
  size = 32,
}: {
  kind: string;
  title: string;
  sub?: ReactNode;
  size?: number;
}) {
  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "6px" })}>
      <Caps>{kind}</Caps>
      <h1
        className={css({ m: 0, fontWeight: "500", letterSpacing: "-0.015em" })}
        style={{ fontSize: size }}
      >
        {title}
      </h1>
      {sub}
    </div>
  );
}

/** A big narrow figure under its label ("ÉCOUTES / 141"), as on the track page. */
export function BigFigure({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "4px" })}>
      <Caps>{label}</Caps>
      <span className={css({ textStyle: "narrow", fontSize: "40px", lineHeight: 1 })}>{value}</span>
    </div>
  );
}

/** Monthly (or weekly, yearly) bars with first, middle and last labels; the record month in black. */
export function PeriodBars({
  periods,
  height,
  format = formatPeriodMonth,
  label,
}: {
  periods: { period: string; listenCount: number }[];
  height: number;
  format?: (period: string) => string;
  label: string;
}) {
  if (periods.length === 0) return null;
  const max = Math.max(...periods.map((p) => p.listenCount));
  const first = periods[0]!;
  const middle = periods[Math.floor(periods.length / 2)]!;
  const last = periods.at(-1)!;
  return (
    <>
      <Bars
        height={height}
        gap={periods.length > 40 ? 1 : 3}
        label={label}
        bars={periods.map((p) => ({
          value: p.listenCount,
          color: p.listenCount === 0 ? "#F0F0F0" : p.listenCount === max ? "#111111" : "#F7B52C",
          label: `${format(p.period)} : ${formatCount(p.listenCount)}`,
        }))}
      />
      <AxisLabels
        items={
          periods.length > 2
            ? [format(first.period), format(middle.period), format(last.period)]
            : [format(first.period), format(last.period)]
        }
      />
    </>
  );
}

/** Fill the months without listens, so the bars keep a regular time scale. */
export function fillMonths(periods: { period: string; listenCount: number }[]) {
  if (periods.length === 0) return periods;
  const counts = new Map(periods.map((p) => [p.period.slice(0, 7), p.listenCount]));
  const sorted = [...counts.keys()].sort();
  const [y0, m0] = sorted[0]!.split("-").map(Number) as [number, number];
  const [y1, m1] = sorted.at(-1)!.split("-").map(Number) as [number, number];
  const out: { period: string; listenCount: number }[] = [];
  for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m === 12 ? ((m = 1), y++) : m++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ period: key, listenCount: counts.get(key) ?? 0 });
  }
  return out;
}

export function recordOf(periods: { period: string; listenCount: number }[]) {
  return periods.reduce<{ period: string; listenCount: number } | null>(
    (best, p) => (!best || p.listenCount > best.listenCount ? p : best),
    null,
  );
}
