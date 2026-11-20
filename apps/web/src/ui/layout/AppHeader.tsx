import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { PlusIcon } from "../icons.tsx";

const bar = css({
  maxWidth: "1000px",
  boxSizing: "border-box",
  mx: "auto",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px 24px",
  px: "24px",
  py: "14px",
});
const side = css({ flex: "1 1 0", display: "flex", alignItems: "center", gap: "18px" });
const navLink = css({
  textDecoration: "none",
  color: "ink",
  "&[data-status=active]": { color: "violet" },
});
export const logo = css({ textDecoration: "none", textStyle: "logo", color: "ink" });

/** Top bar of the signed-in screens: sections, the NEEDLE mark, "Scrobbler" (connect an app) and the account. */
export function AppHeader({ userName }: { userName: string | null }) {
  return (
    <header>
      <div className={bar}>
        <nav aria-label="Principale" className={side} style={{ flexWrap: "wrap", fontSize: 13 }}>
          {userName ? (
            <>
              <Link
                to="/u/$userName"
                params={{ userName }}
                activeOptions={{ exact: true }}
                className={navLink}
              >
                Bibliothèque
              </Link>
              <Link to="/u/$userName/historique" params={{ userName }} className={navLink}>
                Historique
              </Link>
              <Link to="/u/$userName/stats" params={{ userName }} className={navLink}>
                Stats
              </Link>
            </>
          ) : null}
        </nav>
        <Link to="/" className={logo}>
          NEEDLE
        </Link>
        <div className={side} style={{ justifyContent: "flex-end" }}>
          {userName ? (
            <>
              <Link
                to="/reglages/tokens"
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
                Scrobbler
              </Link>
              <Link
                to="/reglages"
                aria-label="Mon compte"
                className={css({
                  width: "28px",
                  height: "28px",
                  borderRadius: "14px",
                  bg: "avatar",
                  color: "avatarInk",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  textStyle: "wide",
                  fontSize: "12px",
                  _hover: { color: "avatarInk" },
                })}
              >
                {userName.charAt(0).toUpperCase()}
              </Link>
            </>
          ) : (
            <Link to="/connexion" className={css({ fontSize: "13px", textDecoration: "none" })}>
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/** Top bar of the account screens (sign-in, sign-up): just the mark, centred. */
export function BareHeader() {
  return (
    <header>
      <div className={bar}>
        <span className={css({ flex: "1 1 0" })} />
        <Link to="/" className={logo}>
          NEEDLE
        </Link>
        <span className={css({ flex: "1 1 0" })} />
      </div>
    </header>
  );
}
