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
      viewBox="12 24 216 208"
      className={mark}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={14}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M82 96 H158 L212 176 L148 218 H92 L28 176 Z" />
      <path d="M82 96 L52 40 L24 52 V64 M158 96 L188 40 L216 52 V64" />
      <path d="M93 96 V218 M111 96 V218 M129 96 V218 M147 96 V218" />
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
