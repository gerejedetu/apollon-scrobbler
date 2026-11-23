import { useRouterState } from "@tanstack/react-router";
import { api } from "../../api/index.ts";
import { utcOffset } from "../../lib/timezone.ts";
import { ProfileHeader } from "../../ui/apollon/index.ts";
import { m } from "../../paraglide/messages.js";
import { coverUrl } from "./links.ts";

/** What the banner draws: the listening hours (its sunrise), the top track or the obsession, the profile card. */
export async function loadBanner(userName: string) {
  const [profile, clock, top, obsession] = await Promise.all([
    api.me.profile(userName),
    api.stats.clock(userName, { range: "all_time", utcOffset: utcOffset() }),
    api.stats.top(userName, "recordings", { range: "this_month", limit: 1 }),
    api.favourites.obsession(userName).catch(() => ({ obsession: null })),
  ]);
  const hours = Array.from(
    { length: 24 },
    (_, h) => clock.hours.find((x) => x.hour === h)?.listenCount ?? 0,
  );
  return { profile, hours, topTrack: top.items[0] ?? null, obsession: obsession.obsession };
}

export type BannerData = Awaited<ReturnType<typeof loadBanner>>;

const TABS = [
  { key: "overview", path: "", label: m.ds_tab_overview },
  { key: "reports", path: "/rapports", label: m.ds_nav_reports },
  { key: "library", path: "/historique", label: m.ds_tab_library },
  { key: "loved", path: "/coups-de-coeur", label: m.ds_tab_loved_long },
  { key: "obsessions", path: "/obsessions", label: m.ds_tab_obsessions },
  { key: "laurels", path: "/lauriers", label: m.ds_tab_laurels },
] as const;

/** The library tabs are several pages (history and the three tops): they all light "Bibliothèque". */
const LIBRARY = ["/historique", "/tops/"];

/**
 * The dark profile banner (design system: ProfileHeader): name, member since, the tabs, and the top track of
 * the month; on Coups de cœur and Obsessions, the obsession instead.
 */
export function ProfileBanner({ userName, banner }: { userName: string; banner: BannerData }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const root = `/u/${encodeURIComponent(userName)}`;
  const rest = decodeURIComponent(pathname).slice(decodeURIComponent(root).length);
  const active =
    TABS.find((t) =>
      t.key === "library"
        ? LIBRARY.some((p) => rest.startsWith(p))
        : t.path === ""
          ? rest === "" || rest === "/"
          : rest.startsWith(t.path),
    ) ?? TABS[0];
  const showObsession =
    (active.key === "loved" || active.key === "obsessions") && banner.obsession !== null;
  const top = showObsession ? banner.obsession : banner.topTrack;
  return (
    <ProfileHeader
      userName={banner.profile.userName}
      createdAt={banner.profile.createdAt}
      hours={banner.hours.some((h) => h > 0) ? banner.hours : undefined}
      tabs={TABS.map((t) => ({ label: t.label(), href: `${root}${t.path}` }))}
      activeTab={active.label()}
      topLabel={showObsession ? m.ds_obsession_now() : m.ds_top_track()}
      topTrack={top ? { track: top.track ?? "", artist: top.artist, album: top.album } : undefined}
      topTrackCoverUrl={top ? coverUrl(top) : undefined}
    />
  );
}
