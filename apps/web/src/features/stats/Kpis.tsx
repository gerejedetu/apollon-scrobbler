import { css } from "styled-system/css";
import type { Compare, Summary } from "../../api/index.ts";
import { barWidth, formatChange, formatCount } from "../../lib/format/index.ts";
import { capsLabel } from "../../ui/primitives/index.ts";
import { color } from "../../ui/theme/index.ts";

const KPIS = [
  { key: "listenCount", label: "ÉCOUTES" },
  { key: "artistCount", label: "ARTISTES" },
  { key: "releaseCount", label: "ALBUMS" },
  { key: "recordingCount", label: "TITRES" },
] as const;

/**
 * Four cards: the figure, its change against the previous period, and bars. For listens the bars are the
 * last days; for the others, the previous period (yellow) beside this one (black).
 */
export function Kpis({
  compare,
  summary,
  daily,
}: {
  /** Null for all_time: no previous period, figures come from the summary. */
  compare: Compare | null;
  summary: Summary;
  daily: number[];
}) {
  return (
    <section
      className={css({
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "16px",
      })}
    >
      {KPIS.map(({ key, label }) => {
        const value = compare ? (compare.current[key] ?? 0) : summary[key];
        const before = compare?.before[key] ?? 0;
        const change = compare?.changePercent[key];
        const pair = compare ? [before, value] : [value];
        const spark = key === "listenCount" && daily.length > 1 ? daily.slice(-14) : pair;
        const max = Math.max(1, ...spark);
        return (
          <div
            key={key}
            className={css({
              p: "20px",
              border: "1px solid token(colors.rule)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            })}
          >
            <div
              className={css({
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              })}
            >
              <span className={capsLabel}>{label}</span>
              {change !== null && change !== undefined ? (
                <span
                  className={css({ fontSize: "12px", fontWeight: "600" })}
                  style={{ color: change >= 0 ? color("up") : color("danger") }}
                >
                  {formatChange(change)}
                </span>
              ) : null}
            </div>
            <span className={css({ textStyle: "narrow", fontSize: "48px", lineHeight: 0.9 })}>
              {formatCount(value)}
            </span>
            <div
              aria-hidden="true"
              className={css({
                height: "28px",
                display: "flex",
                alignItems: "flex-end",
                gap: "3px",
              })}
            >
              {spark.map((n, i) => (
                <div
                  key={i}
                  className={css({ flex: 1 })}
                  style={{
                    height: barWidth(n, max),
                    background: i === spark.length - 1 ? color("ink") : color("yellow"),
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
