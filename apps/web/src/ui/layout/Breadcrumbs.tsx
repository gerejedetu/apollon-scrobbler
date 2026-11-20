import { Fragment, type ReactNode } from "react";
import { css } from "styled-system/css";

/** "Profil › Artistes › Radiohead": every crumb but the last is a link. */
export function Breadcrumbs({ items }: { items: ReactNode[] }) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className={css({
        fontSize: "12px",
        color: "muted",
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        "& a": { color: "muted", textDecoration: "none" },
      })}
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 ? <span aria-hidden="true">›</span> : null}
          {i === items.length - 1 ? <span className={css({ color: "ink" })}>{item}</span> : item}
        </Fragment>
      ))}
    </nav>
  );
}
