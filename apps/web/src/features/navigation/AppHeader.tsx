import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { PlusIcon } from "../../ui/icons.tsx";
import { button } from "../../ui/primitives/index.ts";
import { headerBar, headerSide, logo } from "../../ui/layout/index.ts";
import { AccountMenu } from "./AccountMenu.tsx";

const navLink = css({
  textDecoration: "none",
  color: "ink",
  "&[data-status=active]": { color: "violet" },
});

/**
 * Top bar: sections (hidden on phones, where the tab bar takes over), the NEEDLE mark, "Scrobbler" (add a
 * listen) and the account menu. Signed out: just "Se connecter".
 */
export function AppHeader({
  userName,
  hideOnPhone,
}: {
  userName: string | null;
  hideOnPhone?: boolean;
}) {
  return (
    <header className={hideOnPhone ? css({ display: { base: "none", sm: "block" } }) : undefined}>
      <div className={headerBar}>
        <nav
          aria-label="Principale"
          className={headerSide}
          style={{ flexWrap: "wrap", fontSize: 13 }}
          data-nav
        >
          {userName ? (
            <span className={css({ display: { base: "none", sm: "flex" }, gap: "18px" })}>
              <Link
                to="/u/$userName"
                params={{ userName }}
                activeOptions={{ exact: true }}
                className={navLink}
              >
                Accueil
              </Link>
              <Link to="/u/$userName/historique" params={{ userName }} className={navLink}>
                Historique
              </Link>
              <Link to="/u/$userName/stats" params={{ userName }} className={navLink}>
                Stats
              </Link>
            </span>
          ) : null}
        </nav>
        <Link to="/" className={logo}>
          NEEDLE
        </Link>
        <div className={headerSide} style={{ justifyContent: "flex-end" }}>
          {userName ? (
            <>
              <Link
                to="/scrobbler"
                aria-label="Scrobbler une écoute"
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  textDecoration: "none",
                  color: "violet",
                  fontSize: "13px",
                  fontWeight: "500",
                })}
              >
                <PlusIcon />
                <span className={css({ display: { base: "none", sm: "inline" } })}>Scrobbler</span>
              </Link>
              <AccountMenu userName={userName} />
            </>
          ) : (
            <Link
              to="/connexion"
              className={button({ tone: "outline", size: "xs" })}
              style={{ height: 32, fontSize: 13 }}
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
