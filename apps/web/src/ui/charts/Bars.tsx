import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { barWidth } from "../../lib/format/index.ts";
import { color } from "../../ui/theme/index.ts";

export interface Bar {
  value: number;
  /** Bar colour; yellow by default. */
  color?: string;
  /** Accessible label of the bar ("15 nov. : 96 écoutes"). */
  label?: string;
  /** Drawn as an empty dashed slot (days still to come). */
  pending?: boolean;
  /** A black tag above the bar (the peak). */
  tag?: ReactNode;
}

/**
 * Vertical bars sharing the height of the tallest one. `height` in px; `baseline` is the bottom rule.
 * Exposed to assistive tech as a list of labelled values.
 */
export function Bars({
  bars,
  height,
  gap = 3,
  baseline = "1px dashed var(--colors-dashed)",
  label,
  topPadding = 0,
}: {
  bars: Bar[];
  height: number;
  gap?: number;
  baseline?: string;
  label: string;
  topPadding?: number;
}) {
  const max = Math.max(0, ...bars.map((b) => b.value));
  return (
    <div
      role="img"
      aria-label={label}
      className={css({ position: "relative", display: "flex", alignItems: "flex-end" })}
      style={{
        height,
        gap,
        borderBottom: baseline,
        paddingTop: topPadding,
        boxSizing: "border-box",
      }}
    >
      {bars.map((b, i) => (
        <div
          key={i}
          title={b.label}
          className={css({
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            position: "relative",
          })}
        >
          {b.tag ? (
            <span
              className={css({
                position: "absolute",
                top: "-32px",
                whiteSpace: "nowrap",
                px: "8px",
                py: "4px",
                bg: "ink",
                color: "page",
                fontSize: "11px",
                fontWeight: "500",
              })}
            >
              {b.tag}
            </span>
          ) : null}
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              height: b.pending ? "6%" : barWidth(b.value, max),
              minHeight: b.value > 0 ? 1 : 0,
              background: b.pending ? "transparent" : (b.color ?? color("yellow")),
              border: b.pending ? "1px dashed var(--colors-dashed)" : 0,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** Axis labels under a chart: first, middle (optional) and last. */
export function AxisLabels({ items }: { items: ReactNode[] }) {
  return (
    <div
      className={css({
        display: "flex",
        justifyContent: "space-between",
        fontSize: "11px",
        color: "muted",
      })}
    >
      {items.map((item, i) => (
        <span key={i}>{item}</span>
      ))}
    </div>
  );
}
