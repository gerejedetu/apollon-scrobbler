import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { Wordmark } from "../brand/index.ts";

export const headerBar = css({
  maxWidth: "1000px",
  boxSizing: "border-box",
  mx: "auto",
  // Two equal side columns: the name sits at the exact centre whatever each side holds.
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  alignItems: "center",
  gap: { base: "8px", sm: "24px" },
  px: { base: "16px", sm: "24px" },
  py: "14px",
});
export const headerSide = css({
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "18px",
});
export const logo = css({ textDecoration: "none", textStyle: "logo", color: "ink" });

/** Top bar with the mark centred between two equal sides (account screens, errors). */
export function BareHeader({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <header>
      <div className={headerBar}>
        <span className={headerSide}>{left}</span>
        <Link to="/" className={logo}>
          <Wordmark />
        </Link>
        <span className={headerSide} style={{ justifyContent: "flex-end" }}>
          {right}
        </span>
      </div>
    </header>
  );
}
