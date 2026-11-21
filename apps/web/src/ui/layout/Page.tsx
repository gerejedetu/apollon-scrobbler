import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";
import { APP_NAME } from "../brand/index.ts";

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
      {APP_NAME.toUpperCase()}
    </footer>
  );
}

/** Header, a column of content, the phone tab bar (when given) and the footer. */
export function Page({
  header,
  children,
  tabBar,
}: {
  header: ReactNode;
  children: ReactNode;
  tabBar?: ReactNode;
}) {
  return (
    <div className={shell}>
      {header}
      {children}
      {tabBar}
      <Footer />
    </div>
  );
}

const mainBase = css({
  flex: 1,
  width: "100%",
  boxSizing: "border-box",
  mx: "auto",
  pt: "8px",
  pb: "64px",
  px: { base: "16px", sm: "24px" },
  display: "flex",
  flexDirection: "column",
});

/** The centred 1000 px column of every screen. `gap` follows each board of the design. */
export function Main({
  children,
  gap = 32,
  narrow,
  padding,
  className,
}: {
  children: ReactNode;
  gap?: number;
  /** true: the 448 px column of account forms; a number: that width. */
  narrow?: boolean | number;
  padding?: string;
  className?: string;
}) {
  return (
    <main
      className={cx(mainBase, className)}
      style={{
        maxWidth: typeof narrow === "number" ? narrow : narrow ? 448 : 1000,
        gap,
        ...(padding ? { padding } : {}),
      }}
    >
      {children}
    </main>
  );
}
