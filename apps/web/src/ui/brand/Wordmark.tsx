import { css } from "styled-system/css";
import { APP_NAME } from "./brand.ts";

const mark = css({ flexShrink: 0, color: "ink" });
const row = css({ display: "inline-flex", alignItems: "center", gap: "8px" });

/** The lyre (brand/mark.svg) drawn in the current ink, its sun-shaped sound box in the chart yellow. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="10 8 44 48" className={mark} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M25 45 C 15 41, 12 28, 18 20 C 21 16, 19 11, 13 11" strokeWidth={5} />
        <path d="M39 45 C 49 41, 52 28, 46 20 C 43 16, 45 11, 51 11" strokeWidth={5} />
        <path d="M18 19 H 46" strokeWidth={4.5} />
        <path d="M26.5 20 V 36 M32 20 V 36 M37.5 20 V 36" strokeWidth={2.5} />
      </g>
      <circle cx="32" cy="45" r="9" className={css({ fill: "yellow" })} />
    </svg>
  );
}

/** Mark and name, as the header shows them. */
export function Wordmark() {
  return (
    <span className={row}>
      <Mark />
      {APP_NAME.toUpperCase()}
    </span>
  );
}
