import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";

const shell = css({
  minHeight: "100vh",
  bg: "page",
  color: "ink",
  display: "flex",
  flexDirection: "column",
});

export function Footer() {
  return (
    <footer
      className={css({
        borderTop: "1px solid token(colors.rule)",
        px: "24px",
        py: "20px",
        textAlign: "center",
        textStyle: "wide",
        fontSize: "12px",
      })}
    >
      NEEDLE
    </footer>
  );
}

/** Header, a column of content and the footer. */
export function Page({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className={shell}>
      {header}
      {children}
      <Footer />
    </div>
  );
}

const mainBase = css({
  flex: 1,
  width: "100%",
  boxSizing: "border-box",
  mx: "auto",
  display: "flex",
  flexDirection: "column",
});

/** The centred 1000 px column of every screen. `gap` follows each board of the design. */
export function Main({
  children,
  gap = 32,
  narrow,
  padding = "8px 24px 64px",
  className,
}: {
  children: ReactNode;
  gap?: number;
  narrow?: boolean;
  padding?: string;
  className?: string;
}) {
  return (
    <main
      className={cx(mainBase, className)}
      style={{ maxWidth: narrow ? 448 : 1000, gap, padding }}
    >
      {children}
    </main>
  );
}
