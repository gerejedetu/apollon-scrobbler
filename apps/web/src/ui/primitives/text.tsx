/** Small typographic pieces repeated on every screen. */
import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";

export const capsLabel = css({ textStyle: "label", color: "muted", textTransform: "uppercase" });

export function Caps({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx(capsLabel, className)}>{children}</span>;
}

/** The grey count bubble next to a heading or a tab: "3", "142k". */
export function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className={css({
        px: "6px",
        py: "1px",
        borderRadius: "9px",
        bg: "chip",
        fontSize: "11px",
        fontWeight: "500",
        color: "muted",
      })}
    >
      {children}
    </span>
  );
}

/** The violet "NOUVEAU" tag. */
export function NewTag({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        css({
          px: "5px",
          py: "1px",
          bg: "violet",
          color: "page",
          fontSize: "9px",
          fontWeight: "600",
          letterSpacing: "0.04em",
        }),
        className,
      )}
    >
      NOUVEAU
    </span>
  );
}

/** A figure over its caps label ("142k / ÉCOUTES"). */
export function Stat({
  value,
  label,
  note,
  align = "start",
  title,
}: {
  value: ReactNode;
  label: ReactNode;
  note?: ReactNode;
  align?: "start" | "center";
  title?: string;
}) {
  return (
    <div
      className={css({ display: "flex", flexDirection: "column", gap: "2px" })}
      style={{ alignItems: align === "center" ? "center" : "flex-start" }}
    >
      <span className={css({ fontSize: "16px", fontWeight: "500" })} title={title}>
        {value}
      </span>
      <Caps>{label}</Caps>
      {note ? <span className={css({ fontSize: "11px", color: "muted" })}>{note}</span> : null}
    </div>
  );
}

/** Section heading of a block ("Top albums") with an optional right-hand aside. */
export function BlockHeading({ title, aside }: { title: ReactNode; aside?: ReactNode }) {
  return (
    <div
      className={css({
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "8px",
      })}
    >
      <h2 className={css({ m: 0, textStyle: "block" })}>{title}</h2>
      {aside ? <span className={css({ fontSize: "12px", color: "muted" })}>{aside}</span> : null}
    </div>
  );
}

/** The three display heading voices of the stats pages. */
export const displayHeading = {
  serif: css({ m: 0, textStyle: "serif", fontSize: "40px", lineHeight: 1 }),
  narrow: css({ m: 0, textStyle: "narrow", fontSize: "40px", lineHeight: 1 }),
  wide: css({ m: 0, textStyle: "wide", fontSize: "24px", lineHeight: 1 }),
};

/** A muted empty state. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className={css({ m: 0, fontSize: "13px", color: "muted" })}>{children}</p>;
}
