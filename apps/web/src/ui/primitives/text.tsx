/** Small typographic pieces repeated on every screen. */
import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";
import { m } from "../../paraglide/messages.js";

export const capsLabel = css({ textStyle: "label", color: "muted", textTransform: "uppercase" });

/** Every page's <h1>: one size, one face (Historique, Stats, Réglages, Connexion…). */
export const pageTitle = css({ m: 0, textStyle: "pageTitle", lineHeight: 1.1 });

/** Every block's <h2> ("Top albums", "Paliers", "Écoutes par jour"…). */
export const sectionTitle = css({ m: 0, textStyle: "block" });

/** The grey paragraph under a page title. */
export const lead = css({
  m: 0,
  maxWidth: "560px",
  fontSize: "13px",
  lineHeight: "20px",
  color: "muted",
});

/** Small grey rounded label: counts beside headings and tabs, the client that sent a listen. */
export const badge = css({
  display: "inline-flex",
  alignItems: "center",
  height: "20px",
  px: "7px",
  borderRadius: "pill",
  bg: "chip",
  fontSize: "11px",
  fontWeight: "500",
  color: "muted",
  whiteSpace: "nowrap",
});

export function Caps({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx(capsLabel, className)}>{children}</span>;
}

/** The grey count bubble next to a heading or a tab: "3", "142k". */
export function CountBadge({ children }: { children: ReactNode }) {
  return <span className={badge}>{children}</span>;
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
      {m.new_tag()}
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
      <h2 className={sectionTitle}>{title}</h2>
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
