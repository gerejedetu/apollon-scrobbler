import { css } from "styled-system/css";
import { APP_NAME } from "./brand.ts";

const mark = css({ flexShrink: 0, color: "ink" });
const row = css({ display: "inline-flex", alignItems: "center", gap: "8px" });

/** The lyre (brand/mark.svg), drawn in strokes, in one colour: the current ink. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 4 240 236"
      className={mark}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={10}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M80 65 H160 L210 192 L162 232 H78 L30 192 Z" />
      <path d="M80 65 L55 12 L8 36 V50 M160 65 L185 12 L232 36 V50" />
      <path d="M90 65 V232 M110 65 V232 M130 65 V232 M150 65 V232" />
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
