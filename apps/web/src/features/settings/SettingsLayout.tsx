import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { AppHeader, Page } from "../../ui/layout/index.ts";
import { capsLabel } from "../../ui/primitives/index.ts";

const item = css({
  px: "10px",
  py: "8px",
  borderRadius: "field",
  textDecoration: "none",
  color: "ink",
  "&[data-status=active]": { bg: "field", fontWeight: "500" },
});

/** Settings: a side menu (Profil, Tokens d'API) and the page. */
export function SettingsLayout({ userName, children }: { userName: string; children: ReactNode }) {
  return (
    <Page header={<AppHeader userName={userName} />}>
      <div
        className={css({
          flex: 1,
          width: "100%",
          maxWidth: "1000px",
          boxSizing: "border-box",
          mx: "auto",
          p: "24px 24px 72px",
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          alignItems: "flex-start",
        })}
      >
        <nav
          aria-label="Réglages"
          className={css({
            flex: "1 1 180px",
            maxWidth: "200px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            fontSize: "13px",
          })}
        >
          <span className={capsLabel} style={{ padding: "0 10px 10px" }}>
            RÉGLAGES
          </span>
          <Link to="/reglages" activeOptions={{ exact: true }} className={item}>
            Profil
          </Link>
          <Link to="/reglages/tokens" className={item}>
            Tokens d'API
          </Link>
        </nav>
        <main
          className={css({
            flex: "999 1 560px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "36px",
          })}
        >
          {children}
        </main>
      </div>
    </Page>
  );
}

export const settingsTitle = css({ m: 0, textStyle: "pageTitle" });
