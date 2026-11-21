import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { ChevronLeft, DownloadIcon, KeyIcon, UserIcon } from "../../ui/icons.tsx";
import { Breadcrumbs, Page } from "../../ui/layout/index.ts";
import { AppHeader, MobileTabBar } from "../navigation/index.ts";
import { m } from "../../paraglide/messages.js";

const sideLink = css({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  height: "40px",
  px: "12px",
  borderRadius: "card",
  textDecoration: "none",
  fontSize: "15px",
  color: "muted",
  _hover: { color: "ink" },
  "&[data-status=active]": { color: "ink", bg: "chip" },
});
const tabLink = css({
  flexShrink: 0,
  pb: "12px",
  mb: "-1px",
  textDecoration: "none",
  fontSize: "15px",
  color: "muted",
  borderBottom: "2px solid transparent",
  "&[data-status=active]": { color: "ink", fontWeight: "500", borderBottomColor: "ink" },
});

const PAGES = [
  { to: "/reglages", label: m.tab_profile, icon: <UserIcon size={18} />, exact: true },
  { to: "/reglages/tokens", label: m.settings_tokens, icon: <KeyIcon size={18} />, exact: false },
  {
    to: "/reglages/import",
    label: m.settings_import,
    icon: <DownloadIcon size={18} />,
    exact: false,
  },
] as const;

/**
 * Settings (boards "Réglages", "Tokens d'API", "Importer"): a side menu on large screens; on phones a
 * back bar titled "Réglages" and tabs instead of the app header.
 */
export function SettingsLayout({ userName, children }: { userName: string; children: ReactNode }) {
  return (
    <Page
      header={<AppHeader userName={userName} hideOnPhone />}
      tabBar={<MobileTabBar userName={userName} />}
    >
      <div
        className={css({
          display: { base: "flex", sm: "none" },
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          height: "52px",
          px: "16px",
        })}
      >
        <Link
          to="/u/$userName"
          params={{ userName }}
          aria-label={m.back()}
          className={css({
            position: "absolute",
            left: "12px",
            top: "10px",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "ink",
          })}
        >
          <ChevronLeft size={22} />
        </Link>
        <span className={css({ fontSize: "17px", fontWeight: "500" })}>{m.nav_settings()}</span>
      </div>
      <div
        className={css({
          flex: 1,
          width: "100%",
          maxWidth: "1000px",
          boxSizing: "border-box",
          mx: "auto",
          pt: "8px",
          pb: "96px",
          px: { base: "16px", sm: "24px" },
          display: "flex",
          flexDirection: "column",
        })}
      >
        <div className={css({ display: { base: "none", sm: "block" } })}>
          <Breadcrumbs
            items={[
              <Link key="h" to="/u/$userName" params={{ userName }}>
                {m.nav_home()}
              </Link>,
              m.nav_settings(),
            ]}
          />
        </div>
        <nav
          aria-label={m.nav_settings()}
          className={css({
            display: { base: "flex", sm: "none" },
            gap: "24px",
            overflowX: "auto",
            borderBottom: "1px solid token(colors.rule)",
            mx: "-16px",
            px: "16px",
          })}
        >
          {PAGES.map((p) => (
            <Link key={p.to} to={p.to} activeOptions={{ exact: p.exact }} className={tabLink}>
              {p.label()}
            </Link>
          ))}
        </nav>
        <div
          className={css({
            display: "flex",
            gap: "56px",
            alignItems: "flex-start",
            pt: { base: "24px", sm: "56px" },
          })}
        >
          <aside
            className={css({
              display: { base: "none", sm: "flex" },
              width: "240px",
              flexShrink: 0,
              flexDirection: "column",
              gap: "4px",
            })}
          >
            <span
              className={css({
                px: "12px",
                pb: "10px",
                fontSize: "12px",
                fontWeight: "500",
                letterSpacing: "0.08em",
                color: "muted",
              })}
            >
              {m.settings_caps()}
            </span>
            <nav
              aria-label={m.nav_settings()}
              className={css({ display: "flex", flexDirection: "column", gap: "4px" })}
            >
              {PAGES.map((p) => (
                <Link key={p.to} to={p.to} activeOptions={{ exact: p.exact }} className={sideLink}>
                  {p.icon}
                  {p.label()}
                </Link>
              ))}
            </nav>
          </aside>
          <main
            className={css({
              flex: 1,
              minWidth: 0,
              maxWidth: "680px",
              display: "flex",
              flexDirection: "column",
              gap: "36px",
            })}
          >
            {children}
          </main>
        </div>
      </div>
    </Page>
  );
}

/** Page titles of the settings: large on screens, hidden on phones (the back bar says "Réglages"). */
export const settingsTitle = css({
  m: 0,
  display: { base: "none", sm: "block" },
  textStyle: "wide",
  fontSize: "44px",
  letterSpacing: "-0.02em",
  lineHeight: 1.05,
});
