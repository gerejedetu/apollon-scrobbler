import { useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { type CSSProperties, type ReactNode, useState, useSyncExternalStore } from "react";
import { authClient, forgetViewer, type Viewer } from "../../auth/index.ts";
import { initialTheme, renderedTheme } from "../../lib/theme.ts";
import { getLocale, type Locale, setLocale } from "../../paraglide/runtime.js";
import {
  accentVars,
  MobileMenu,
  MobileTabBar,
  SiteFooter,
  SiteHeader,
} from "../../ui/apollon/index.ts";
import { SOURCE_URL } from "../../ui/brand/index.ts";
import { sectionHref } from "../apollon/Settings.tsx";
import { m } from "../../paraglide/messages.js";

/** The profile a page belongs to (its owner's colour, its tabs), or none (settings, sign-in…). */
export interface ShellProfile {
  userName: string;
  accent: string | null;
}

const profilePath = (userName: string, rest = "") => `/u/${encodeURIComponent(userName)}${rest}`;

/**
 * Every page's frame (design system: SiteHeader, SiteFooter, MobileTabBar, MobileMenu): the black bar,
 * the content, the footer, and on phones the bottom tabs and the full-screen menu. On a profile, the page
 * takes the owner's colour (accent).
 */
export function Shell({
  viewer,
  profile,
  signupOpen,
  children,
}: {
  viewer: Viewer;
  profile?: ShellProfile | null;
  signupOpen?: boolean;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  // The browser's time zone, once hydrated (the server does not know it).
  const zone = useSyncExternalStore(noop, timeZone, () => "UTC");
  // Whose pages the navigation points at: the profile being read, else the viewer's own.
  const owner = profile?.userName ?? viewer?.userName ?? null;
  const visitor = viewer === null;

  const links = owner
    ? visitor ||
      (profile && viewer && profile.userName.toLowerCase() !== viewer.userName.toLowerCase())
      ? [
          { label: m.ds_nav_profile(), href: profilePath(owner) },
          { label: m.ds_nav_reports(), href: profilePath(owner, "/rapports") },
        ]
      : [
          { label: m.ds_nav_music(), href: profilePath(owner) },
          { label: m.ds_nav_reports(), href: profilePath(owner, "/rapports") },
          { label: m.ds_nav_wrapped(), href: profilePath(owner, "/retrospective") },
        ]
    : [];
  const current = (href: string) =>
    href === profilePath(owner ?? "")
      ? pathname === href || pathname === `${href}/`
      : pathname.startsWith(href);

  const tabs = owner
    ? [
        { value: "profile", label: m.ds_tab_profile(), icon: "user", href: profilePath(owner) },
        {
          value: "reports",
          label: m.ds_nav_reports(),
          icon: "chart",
          href: profilePath(owner, "/rapports"),
        },
        {
          value: "search",
          label: m.ds_tab_search(),
          icon: "search",
          href: profilePath(owner, "/recherche"),
        },
        {
          value: "laurels",
          label: m.ds_tab_laurels(),
          icon: "laurel",
          href: profilePath(owner, "/lauriers"),
        },
        {
          value: "loved",
          label: m.ds_tab_loved(),
          icon: "heart",
          href: profilePath(owner, "/coups-de-coeur"),
        },
      ]
    : null;
  const activeTab =
    tabs
      ?.slice()
      .reverse()
      .find((t) => t.value !== "profile" && pathname.startsWith(t.href))?.value ??
    (owner && pathname.startsWith(profilePath(owner)) ? "profile" : undefined);

  async function signOut() {
    setMenuOpen(false);
    await authClient.signOut();
    forgetViewer();
    await navigate({ to: "/connexion" });
    await router.invalidate();
  }

  const style = (
    profile?.accent ? accentVars(profile.accent, renderedTheme(initialTheme())) : undefined
  ) as CSSProperties | undefined;

  return (
    <div className={tabs ? "ap-root ap-shell ap-has-tabbar" : "ap-root ap-shell"} style={style}>
      <SiteHeader
        userName={viewer?.userName}
        visitor={visitor}
        signupOpen={signupOpen}
        loginHref="/connexion"
        signupHref="/inscription"
        owner={viewer?.owner === true}
        profileHref={viewer ? profilePath(viewer.userName) : undefined}
        sectionHref={sectionHref}
        onAccount={(choice: string) => (choice === "logout" ? void signOut() : undefined)}
        links={links.map((l) => ({ ...l, current: current(l.href) }))}
        onSearch={() => (owner ? router.history.push(profilePath(owner, "/recherche")) : undefined)}
        onMenu={() => setMenuOpen(true)}
      />
      <main className="ap-shell__main">{children}</main>
      <SiteFooter
        columns={[
          {
            title: m.ds_footer_instance(),
            links: [
              { label: m.ds_footer_about(), href: "/" },
              { label: m.ds_footer_version(), href: `${SOURCE_URL}/commits/main` },
            ],
          },
          {
            title: m.ds_footer_help(),
            links: [
              {
                label: m.ds_footer_connect_player(),
                href: visitor ? "/connexion" : "/reglages/cles",
              },
              {
                label: m.ds_footer_import_lastfm(),
                href: visitor ? "/connexion" : "/reglages/import",
              },
            ],
          },
          visitor
            ? {
                title: m.ds_footer_join(),
                links: [
                  { label: m.signin_submit(), href: "/connexion" },
                  ...(signupOpen ? [{ label: m.signin_create(), href: "/inscription" }] : []),
                ],
              }
            : {
                title: m.ds_footer_account(),
                links: [
                  { label: m.account_settings(), href: "/reglages/profil" },
                  { label: m.settings_tokens(), href: "/reglages/cles" },
                  { label: m.ds_import_export(), href: "/reglages/import" },
                ],
              },
          {
            title: m.ds_footer_project(),
            links: [
              { label: m.ds_footer_source(), href: SOURCE_URL },
              { label: m.ds_footer_issue(), href: `${SOURCE_URL}/issues` },
              { label: m.ds_footer_notes(), href: `${SOURCE_URL}/commits/main` },
            ],
          },
        ]}
        timeZone={zone}
        lang={getLocale()}
        onLang={(locale: Locale) => void setLocale(locale)}
      />
      {tabs ? <MobileTabBar items={tabs} active={activeTab} /> : null}
      {menuOpen ? (
        <MobileMenu
          userName={viewer?.userName}
          visitor={visitor}
          signupOpen={signupOpen}
          loginHref="/connexion"
          signupHref="/inscription"
          links={links}
          active={links.find((l) => current(l.href))?.label}
          lang={getLocale()}
          onLang={(locale: Locale) => void setLocale(locale)}
          onClose={() => setMenuOpen(false)}
          accountLinks={[
            { label: m.account_settings(), href: "/reglages/profil" },
            { label: m.settings_tokens(), href: "/reglages/cles" },
            { label: m.ds_import_export(), href: "/reglages/import" },
            { label: m.signout(), onClick: () => void signOut() },
          ]}
        />
      ) : null}
    </div>
  );
}

const noop = () => () => {};

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}
