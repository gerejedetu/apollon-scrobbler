import { Link } from "@tanstack/react-router";
import { css, cx } from "styled-system/css";
import { PlusIcon } from "../../ui/icons.tsx";
import { button } from "../../ui/primitives/index.ts";
import { headerBar, headerSide, logo } from "../../ui/layout/index.ts";
import { Wordmark } from "../../ui/brand/index.ts";
import { AccountMenu } from "./AccountMenu.tsx";
import { PreferencesMenu } from "./Preferences.tsx";
import { m } from "../../paraglide/messages.js";

const navLink = css({
  textDecoration: "none",
  color: "ink",
  "&[data-status=active]": { color: "violet" },
});

/**
 * Top bar: sections (hidden on phones, where the tab bar takes over), the Apollon wordmark, "Scrobbler" (add a
 * listen) and the account menu. Signed out: language and theme on the left, "Se connecter" on the right.
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
          aria-label={m.nav_main()}
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
                {m.nav_home()}
              </Link>
              <Link to="/u/$userName/historique" params={{ userName }} className={navLink}>
                {m.nav_history()}
              </Link>
              <Link to="/u/$userName/rapports" params={{ userName }} className={navLink}>
                {m.nav_stats()}
              </Link>
            </span>
          ) : (
            // Signed out: language and theme on the left, sign-in on the right, the name centred.
            <PreferencesMenu />
          )}
        </nav>
        <Link to="/" className={logo}>
          <Wordmark />
        </Link>
        <div className={headerSide} style={{ justifyContent: "flex-end" }}>
          {userName ? (
            <>
              <Link
                to="/scrobbler"
                aria-label={m.scrobble_title()}
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
                <span className={css({ display: { base: "none", sm: "inline" } })}>
                  {m.nav_scrobble()}
                </span>
              </Link>
              <AccountMenu userName={userName} />
            </>
          ) : (
            <Link
              to="/connexion"
              // A little narrower on phones, so the name stays centred between the two sides.
              className={cx(
                button({ tone: "outline", size: "sm" }),
                css({ px: { base: "10px", sm: "12px" } }),
              )}
            >
              {m.signin_submit()}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
