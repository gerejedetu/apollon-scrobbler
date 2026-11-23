import { useNavigate } from "@tanstack/react-router";
import type { Listen, Range, TopItem } from "../../api/index.ts";
import { dateFormat } from "../../lib/locale.ts";
import { rangeOptions } from "../../lib/ranges.ts";
import {
  ActionCard,
  ArtworkGrid,
  Button,
  Columns,
  MediaRow,
  MoreLink,
  ObsessionCard,
  Page,
  ReportCard,
  SectionHeader,
  StatInline,
  StreakCard,
  TopChart,
  TrackList,
  TrendBadge,
} from "../../ui/apollon/index.ts";
import { useFavourites } from "../favourites/index.ts";
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
import type { OverviewData, OverviewPeriods } from "./overview.ts";

const periods = () => rangeOptions().map(({ value, label }) => ({ value, label }));

/** The profile's overview (design system: PageProfile): counters, cards, recent listens, tops; streak, reports, on repeat. */
export function Overview({
  userName,
  data,
  selected,
}: {
  userName: string;
  data: OverviewData;
  selected: OverviewPeriods;
}) {
  const navigate = useNavigate();
  const fav = useFavourites();
  const root = `/u/${encodeURIComponent(userName)}`;
  const setPeriod = (key: "artistes" | "albums" | "titres", value: string) =>
    void navigate({
      to: "/u/$userName",
      params: { userName },
      search: (s: Record<string, unknown>) => ({ ...s, [key]: value as Range }),
      resetScroll: false,
    } as never);
  // "C'est mon obsession": what is playing now, else the last listen.
  const candidate = data.nowPlaying ?? data.listens.listens[0] ?? null;
  const loved = (t: { artist: string; track?: string | null }) =>
    t.track ? fav.isLoved({ artist: t.artist, track: t.track }) : false;

  const main = [
    <div key="stats" className="ap-ov__stats">
      <StatInline
        stats={[
          { label: m.ds_scrobbles(), value: data.summary.listenCount },
          { label: m.tab_artists(), value: data.summary.artistCount },
        ]}
      />
      {fav.owner && candidate && !fav.isObsession(candidate) ? (
        <Button variant="primary" onClick={() => void fav.toggleObsession(candidate)}>
          {m.ds_its_my_obsession()}
        </Button>
      ) : null}
    </div>,
    fav.owner || fav.obsession ? (
      <div key="cards" className="ap-ov__cards">
        <ObsessionCard
          obsession={fav.obsession}
          userName={fav.owner ? undefined : userName}
          coverUrl={fav.obsession ? coverUrl(fav.obsession) : undefined}
          onSet={fav.owner && candidate ? () => void fav.toggleObsession(candidate) : undefined}
          onClear={
            fav.owner && fav.obsession
              ? () => void fav.toggleObsession(fav.obsession as never)
              : undefined
          }
        />
        {data.discovery ? (
          <ActionCard
            title={m.ds_discover({ artist: data.discovery.artistName })}
            hint={m.ds_discover_hint({ count: data.discovery.listenCount })}
            art="discover"
            onClick={() =>
              void navigate({ href: artistHref(userName, data.discovery!.artistName) })
            }
          />
        ) : null}
      </div>
    ) : null,
    <section key="recent">
      <SectionHeader title={m.recent_listens()} showPeriod={false} />
      <TrackList
        listens={data.listens.listens.filter((l) => !fav.isDeleted(l))}
        nowPlaying={data.nowPlaying}
        readOnly={!fav.owner}
        isLoved={loved}
        onToggleLove={(l: Listen) => void fav.toggleLove(l)}
        coverFor={(l: Listen) => coverUrl(l)}
        titleHref={(l: { artist: string; track: string; album?: string | null }) =>
          trackHref(userName, l)
        }
        artistLinks={(l: { artist: string }) => artistLinks(userName, l.artist)}
        playHref={(l: Listen) => playHref(l)}
        trailing={fav.owner ? (l: Listen) => <ListenMenu listen={l} /> : undefined}
      />
      <MoreLink href={`${root}/historique`}>{m.ds_more_scrobbles()}</MoreLink>
    </section>,
    <section key="artists">
      <SectionHeader
        title={m.top_artists()}
        periods={periods()}
        period={selected.artists}
        onPeriodChange={(v: string) => setPeriod("artistes", v)}
      />
      <ArtworkGrid
        entity="artists"
        items={data.artists.items.map((a) => ({
          name: a.artist,
          listenCount: a.listenCount,
          imageUrl: artistImage(a.artist),
          href: artistHref(userName, a.artist),
        }))}
      />
      <MoreLink href={`${root}/tops/artistes?periode=${selected.artists}`}>
        {m.ds_more_artists()}
      </MoreLink>
    </section>,
    <section key="albums">
      <SectionHeader
        title={m.top_albums()}
        periods={periods()}
        period={selected.albums}
        onPeriodChange={(v: string) => setPeriod("albums", v)}
      />
      <ArtworkGrid
        entity="releases"
        items={data.albums.items.map((a) => ({
          name: a.album ?? "",
          sub: a.artist,
          listenCount: a.listenCount,
          imageUrl: coverUrl(a, 500),
          href: albumHref(userName, a.artist, a.album ?? ""),
        }))}
      />
      <MoreLink href={`${root}/tops/albums?periode=${selected.albums}`}>
        {m.ds_more_albums()}
      </MoreLink>
    </section>,
    <section key="tracks">
      <SectionHeader
        title={m.top_tracks()}
        periods={periods()}
        period={selected.tracks}
        onPeriodChange={(v: string) => setPeriod("titres", v)}
      />
      <TopChart
        entity="recordings"
        unit={m.ds_scrobbles_unit()}
        items={data.tracks.items}
        readOnly={!fav.owner}
        isLoved={loved}
        onToggleLove={(t: TopItem) =>
          void fav.toggleLove({ artist: t.artist, track: t.track ?? "", album: t.album })
        }
        coverFor={(i: TopItem) => coverUrl(i)}
        hrefFor={(i: { artist: string; track: string; album?: string | null }) =>
          trackHref(userName, i)
        }
        artistLinks={(i: { artist: string }) => artistLinks(userName, i.artist)}
      />
      <MoreLink href={`${root}/tops/titres?periode=${selected.tracks}`}>
        {m.ds_more_tracks()}
      </MoreLink>
    </section>,
  ].filter(Boolean);

  const week = data.reports.week;
  const side = [
    <StreakCard
      key="streak"
      current={{ days: data.streaks.current.days, since: data.streaks.current.since ?? undefined }}
      longest={{
        days: data.streaks.longest?.days ?? 0,
        from: data.streaks.longest?.from,
        to: data.streaks.longest?.to,
      }}
      days={data.days}
    />,
    <section key="reports">
      <SectionHeader title={m.ds_listening_reports()} size="sm" showPeriod={false} />
      <div className="ap-ov__reports">
        <ReportCard
          title={`${dayMonth(week.from)} – ${dayMonth(week.to)}`}
          subtitle={m.ds_the_week()}
          bars={week.bars}
          href={`${root}/rapports?periode=semaine`}
        />
        <ReportCard
          title={monthName(data.reports.month.from)}
          subtitle={m.ds_the_month()}
          bars={data.reports.month.bars}
          href={`${root}/rapports?periode=mois`}
        />
        <ReportCard
          title={String(new Date(data.reports.year.from * 1000).getUTCFullYear())}
          subtitle={m.ds_the_year()}
          bars={data.reports.year.bars}
          href={`${root}/rapports?periode=annee`}
        />
      </div>
    </section>,
    data.onRepeat.items.length ? (
      <section key="repeat">
        <SectionHeader title={m.on_repeat()} size="sm" showPeriod={false} />
        {data.onRepeat.items.map((r) => (
          <a
            key={`${r.artistName}/${r.trackName}`}
            href={trackHref(userName, { artist: r.artistName, track: r.trackName ?? "" })}
            className="ap-ov__media"
          >
            <MediaRow
              title={r.trackName ?? r.artistName}
              sub={r.artistName}
              coverUrl={coverUrl({
                artist: r.artistName,
                album: r.releaseName,
                track: r.trackName,
              })}
              meta={m.ds_repeat_meta({ count: r.current })}
              trailing={<TrendBadge direction="up" label={`+${r.change}`} />}
            />
          </a>
        ))}
      </section>
    ) : null,
  ].filter(Boolean);

  return (
    <Page>
      <Columns main={main} side={side} />
    </Page>
  );
}

const dayMonth = (s: number) =>
  dateFormat({ day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(s * 1000));
const monthName = (s: number) => {
  const name = dateFormat({ month: "long", timeZone: "UTC" }).format(new Date(s * 1000));
  return name.charAt(0).toUpperCase() + name.slice(1);
};
