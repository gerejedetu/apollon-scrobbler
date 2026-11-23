import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useState } from "react";
import {
  api,
  type Listen,
  type ListensPage,
  type Range,
  type Top,
  type TopItem,
  type Track,
} from "../../api/index.ts";
import { rangeOptions } from "../../lib/ranges.ts";
import {
  Button,
  Columns,
  LibraryTabs,
  Page,
  SearchField,
  SectionHeader,
  StatInline,
  TextField,
  TopChart,
  TrackList,
  TrendChart,
} from "../../ui/apollon/index.ts";
import { LoadMore } from "../../ui/feedback/index.ts";
import { useFavourites } from "../favourites/index.ts";
import { localToUnix } from "../scrobble/index.ts";
import { olderCursor, PAGE_SIZE } from "../listens/pages.ts";
import { KINDS, type Kind } from "../tops/kinds.ts";
import { m } from "../../paraglide/messages.js";
import {
  albumHref,
  artistHref,
  artistImage,
  artistLinks,
  coverUrl,
  playHref,
  trackHref,
} from "./links.ts";
import { ListenMenu } from "./ListenMenu.tsx";

export type LibraryTab = "listens" | Kind;

/** The library's frame (design system: PageLibrary): title, the four tabs, main column and sidebar. */
function LibraryFrame({
  userName,
  tab,
  main,
  side,
}: {
  userName: string;
  tab: LibraryTab;
  main: ReactNode[];
  side: ReactNode[];
}) {
  const root = `/u/${encodeURIComponent(userName)}`;
  return (
    <Page>
      <h1 className="ap-pagetitle">{m.ds_tab_library()}</h1>
      <LibraryTabs
        value={tab}
        tabs={[
          {
            value: "listens",
            label: m.ds_scrobbles(),
            icon: "history",
            href: `${root}/historique`,
          },
          {
            value: "artistes",
            label: m.tab_artists(),
            icon: "star",
            href: `${root}/tops/artistes`,
          },
          { value: "albums", label: m.tab_albums(), icon: "disc", href: `${root}/tops/albums` },
          { value: "titres", label: m.tab_tracks(), icon: "note", href: `${root}/tops/titres` },
        ]}
      />
      <div className="ap-lib__gap" />
      <Columns main={main} side={side} />
    </Page>
  );
}

/** Search box of the sidebar: opens the search page. */
function SearchBox({ userName }: { userName: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        if (q.trim())
          void navigate({
            href: `/u/${encodeURIComponent(userName)}/recherche?q=${encodeURIComponent(q.trim())}`,
          });
      }}
    >
      <SearchField
        value={q}
        onChange={(e: { target: { value: string } }) => setQ(e.target.value)}
        placeholder={m.ds_search_placeholder()}
        enterKeyHint="search"
      />
    </form>
  );
}

/** Scrobbles tab: every listen by day, older ones as the page scrolls; jump to a date. */
export function LibraryListens({
  userName,
  first,
  total,
  averagePerDay,
  nowPlaying,
  startAt,
  month,
}: {
  userName: string;
  first: ListensPage;
  total: number;
  averagePerDay: number;
  nowPlaying: Track | null;
  startAt?: number;
  month: { date: string; listenCount: number }[];
}) {
  const fav = useFavourites();
  const navigate = useNavigate();
  const [listens, setListens] = useState(first.listens);
  const [cursor, setCursor] = useState(() => olderCursor(first));
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");

  async function more() {
    if (cursor === null || loading) return;
    setLoading(true);
    try {
      const next = await api.listens.list(userName, { before: cursor, limit: PAGE_SIZE });
      setListens((l) => [...l, ...next.listens]);
      setCursor(olderCursor(next));
    } finally {
      setLoading(false);
    }
  }

  const main = [
    <StatInline
      key="stats"
      stats={[
        { label: m.ds_scrobbles(), value: total },
        { label: m.ds_daily_average(), value: Math.round(averagePerDay) },
      ]}
    />,
    <div key="list">
      <TrackList
        groupByDay
        listens={listens.filter((l) => !fav.isDeleted(l))}
        nowPlaying={startAt === undefined ? nowPlaying : null}
        readOnly={!fav.owner}
        isLoved={(t: Track) => fav.isLoved(t)}
        onToggleLove={(t: Track) => void fav.toggleLove(t)}
        coverFor={(l: Listen) => coverUrl(l)}
        titleHref={(l: Track) => trackHref(userName, l)}
        artistLinks={(l: Track) => artistLinks(userName, l.artist)}
        playHref={(l: Track) => playHref(l)}
        trailing={fav.owner ? (l: Listen) => <ListenMenu listen={l} /> : undefined}
      />
      {cursor !== null ? (
        <LoadMore
          onMore={() => void more()}
          loading={loading}
          label={m.show_more()}
          loadingLabel={m.loading()}
        />
      ) : null}
    </div>,
  ];
  const side = [
    <SearchBox key="q" userName={userName} />,
    <section key="date">
      <SectionHeader title={m.history_goto()} size="sm" showPeriod={false} />
      <form
        className="ap-lib__date"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          const midnight = localToUnix(date, "00:00");
          if (midnight === undefined) return;
          void navigate({
            to: "/u/$userName/historique",
            params: { userName },
            search: { avant: midnight + 86_400 },
          });
        }}
      >
        <TextField
          type="date"
          value={date}
          onChange={(e: { target: { value: string } }) => setDate(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={!date}>
          {m.go()}
        </Button>
      </form>
    </section>,
    month.length ? (
      <section key="chart">
        <SectionHeader title={m.listens_per_day()} size="sm" showPeriod={false} />
        <TrendChart
          variant="bars"
          points={month.map((d) => ({
            label: d.date,
            tick: String(Number(d.date.slice(8))),
            value: d.listenCount,
          }))}
          tickEvery={5}
          highlightLast
        />
      </section>
    ) : null,
  ].filter(Boolean);
  return <LibraryFrame userName={userName} tab="listens" main={main} side={side} />;
}

export const TOP_PAGE = 50;

/** Artists, Albums or Titres tab: the whole ranking for a period, longer as the page scrolls. */
export function LibraryTop({
  userName,
  kind,
  range,
  first,
}: {
  userName: string;
  kind: Kind;
  range: Range;
  first: Top;
}) {
  const fav = useFavourites();
  const navigate = useNavigate();
  const entity = KINDS[kind].entity;
  const [items, setItems] = useState(first.items);
  const [loading, setLoading] = useState(false);

  async function more() {
    if (loading || items.length >= first.total) return;
    setLoading(true);
    try {
      const page = await api.stats.top(userName, entity, {
        range,
        limit: TOP_PAGE,
        offset: items.length,
      });
      setItems((i) => [...i, ...page.items]);
    } finally {
      setLoading(false);
    }
  }

  const hrefFor = (i: TopItem) =>
    entity === "artists"
      ? artistHref(userName, i.artist)
      : entity === "releases"
        ? albumHref(userName, i.artist, i.album ?? "")
        : trackHref(userName, { artist: i.artist, track: i.track ?? "", album: i.album });

  const main = [
    <StatInline key="stats" stats={[{ label: KINDS[kind].title(), value: first.total }]} />,
    <div key="chart">
      <TopChart
        entity={entity}
        unit={m.ds_scrobbles_unit()}
        items={items}
        readOnly={!fav.owner || entity !== "recordings"}
        isLoved={(i: TopItem) =>
          i.track ? fav.isLoved({ artist: i.artist, track: i.track }) : false
        }
        onToggleLove={(i: TopItem) =>
          void fav.toggleLove({ artist: i.artist, track: i.track ?? "", album: i.album })
        }
        coverFor={(i: TopItem) => (entity === "artists" ? artistImage(i.artist, 250) : coverUrl(i))}
        hrefFor={hrefFor}
        artistLinks={(i: TopItem) => artistLinks(userName, i.artist)}
      />
      {items.length < first.total ? (
        <LoadMore
          onMore={() => void more()}
          loading={loading}
          label={m.show_more()}
          loadingLabel={m.loading()}
        />
      ) : null}
    </div>,
  ];
  const side = [
    <section key="period">
      <SectionHeader
        title={m.ds_period()}
        size="sm"
        periods={rangeOptions().map(({ value, label }) => ({ value, label }))}
        period={range}
        onPeriodChange={(v: string) =>
          void navigate({
            to: "/u/$userName/tops/$kind",
            params: { userName, kind },
            search: { periode: v as Range },
          })
        }
      />
    </section>,
    <SearchBox key="q" userName={userName} />,
  ];
  return <LibraryFrame userName={userName} tab={kind} main={main} side={side} />;
}
