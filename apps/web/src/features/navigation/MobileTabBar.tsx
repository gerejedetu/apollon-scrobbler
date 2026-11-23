import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { BarsIcon, HomeIcon, PlusIcon, PulseIcon, UserIcon } from "../../ui/icons.tsx";
import { m } from "../../paraglide/messages.js";

const tab = css({
  flex: 1,
  height: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "pill",
  color: "muted",
  textDecoration: "none",
  "&[data-status=active]": { color: "ink", bg: "chip" },
  _hover: { color: "ink" },
});

/** Phones only: the floating tab bar at the bottom (Accueil, Historique, Scrobbler, Stats, Réglages). */
export function MobileTabBar({ userName }: { userName: string }) {
  const params = { userName };
  return (
    <nav
      aria-label={m.nav_mobile()}
      className={css({
        display: { base: "flex", sm: "none" },
        position: "sticky",
        bottom: "12px",
        zIndex: 20,
        justifyContent: "space-between",
        gap: "4px",
        mx: "12px",
        mb: "12px",
        p: "6px",
        borderRadius: "pill",
        bg: "raised",
        border: "1px solid token(colors.rule)",
        boxShadow: "0 8px 24px token(colors.shadow)",
      })}
    >
      <Link
        to="/u/$userName"
        params={params}
        activeOptions={{ exact: true }}
        aria-label={m.nav_home()}
        className={tab}
      >
        <HomeIcon />
      </Link>
      <Link
        to="/u/$userName/historique"
        params={params}
        aria-label={m.nav_history()}
        className={tab}
      >
        <PulseIcon />
      </Link>
      <Link to="/scrobbler" aria-label={m.nav_scrobble()} className={tab}>
        <PlusIcon size={24} />
      </Link>
      <Link to="/u/$userName/rapports" params={params} aria-label={m.nav_stats()} className={tab}>
        <BarsIcon />
      </Link>
      <Link to="/reglages" aria-label={m.nav_settings()} className={tab}>
        <UserIcon size={24} />
      </Link>
    </nav>
  );
}
