import { css } from "styled-system/css";
import { APP_NAME } from "./brand.ts";

const mark = css({ flexShrink: 0, color: "ink" });
const row = css({ display: "inline-flex", alignItems: "center", gap: "8px" });

/** The lyre (brand/mark.svg), in one colour: the current ink. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="10 8 44 48" className={mark} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24.5 44 C 14.5 40, 12 28, 18 20.5 C 21 16.5, 19.5 12, 14 12" strokeWidth={5.5} />
        <path d="M39.5 44 C 49.5 40, 52 28, 46 20.5 C 43 16.5, 44.5 12, 50 12" strokeWidth={5.5} />
        <path d="M18 20 H 46" strokeWidth={5} />
        <path d="M27.5 21 V 38 M36.5 21 V 38" strokeWidth={3} />
      </g>
      <circle cx="32" cy="45" r="7.5" fill="currentColor" />
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
