import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { css } from "styled-system/css";

export const headerBar = css({
  maxWidth: "1000px",
  boxSizing: "border-box",
  mx: "auto",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px 24px",
  px: { base: "16px", sm: "24px" },
  py: "14px",
});
export const headerSide = css({
  flex: "1 1 0",
  display: "flex",
  alignItems: "center",
  gap: "18px",
});
export const logo = css({ textDecoration: "none", textStyle: "logo", color: "ink" });

/** Top bar with only the mark, centred (account screens), or the mark and something on the right. */
export function BareHeader({ right }: { right?: ReactNode }) {
  return (
    <header>
      <div className={headerBar}>
        <span className={headerSide} />
        <Link to="/" className={logo}>
          NEEDLE
        </Link>
        <span className={headerSide} style={{ justifyContent: "flex-end" }}>
          {right}
        </span>
      </div>
    </header>
  );
}
