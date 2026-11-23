import { useNavigate } from "@tanstack/react-router";
import type { Activity } from "../../api/index.ts";
import { formatCount, formatDate, formatDayMonth, parseDay } from "../../lib/format/index.ts";
import { dateFormat } from "../../lib/locale.ts";
import {
  CategoryTile,
  CompareBars,
  FingerprintRadar,
  HourClock,
  ReportHero,
  ReportMini,
  ReportNav,
  ReportPage,
  ReportPanel,
  ReportSection,
  ReportStat,
  StreakCard,
  TopFeature,
} from "../../ui/apollon/index.ts";
import { m } from "../../paraglide/messages.js";
import { artistImage, coverUrl } from "./links.ts";
import type { ReportData, ReportPeriod } from "./reports.ts";

const pct = (n: number | null | undefined) => (n == null ? undefined : Math.round(n));
const share = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Bars of the hero: this period against the previous one, day by day (month by month for a year). */
function heroBars(
  current: Activity,
  previous: Activity | null,
  granularity: "day" | "month",
  week: boolean,
) {
  if (granularity === "month") {
    const prev = previous?.periods ?? [];
    return (current.periods ?? []).map((p, i) => ({
      label: dateFormat({ month: "short", timeZone: "UTC" }).format(
        new Date(`${p.period}-01T00:00:00Z`),
      ),
      current: p.listenCount,
      previous: prev[i]?.listenCount ?? 0,
    }));
  }
  const prev = previous?.days ?? [];
  const cur = current.days ?? [];
  // A running week or month shows its full length: days still to come are empty.
  const length = Math.max(cur.length, prev.length);
  // Days are compared by position: the 1st with the 1st, Monday with Monday.
  const weekday = dateFormat({ weekday: "short", timeZone: "UTC" });
  return Array.from({ length }, (_, i) => {
    return {
      label: week
        ? weekday.format(new Date(Date.UTC(2024, 0, 1 + i))).replace(".", "")
        : String(i + 1),
      current: cur[i]?.listenCount ?? 0,
      previous: prev[i]?.listenCount ?? 0,
    };
  });
}

/** A listening report (design system: PageReports), black in every theme: the week, the month or the year. */
export function Reports({
  userName,
  period,
  past,
  data,
}: {
  userName: string;
  period: ReportPeriod;
  past: boolean;
  data: ReportData;
}) {
  const navigate = useNavigate();
  const go = (next: { periode: ReportPeriod; precedente?: boolean }) =>
    void navigate({
      to: "/u/$userName/rapports",
      params: { userName },
      search: { periode: next.periode, precedente: next.precedente || undefined },
    });
  const c = data.compare;
  const granularity = period === "annee" ? "month" : "day";
  const prevLabel =
    period === "semaine"
      ? m.ds_prev_week()
      : period === "mois"
        ? m.ds_prev_month()
        : m.ds_prev_year();
  const cur = data.summary;
  const before = data.summaryBefore;
  const newArtists = data.discoveries.artists.total;
  const newTracks = data.discoveries.tracks.total;
  const activeDays = cur.activeDays;
  const spanDays = Math.max(1, Math.round((data.compare.to - data.compare.from) / 86_400) || 1);
  const div = data.diversity;
  const axes = (
    d: typeof div | null,
    days: number,
    discovered: number,
    artists: number,
    listens: number,
    tracks: number,
  ) => ({
    constance: Math.min(1, days / spanDays),
    discovery: artists ? discovered / artists : 0,
    // The API gives these two as percentages.
    variety: (d?.uniqueArtistRatio ?? 0) / 100,
    focus: (d?.top10ArtistShare ?? 0) / 100,
    replay: listens ? 1 - tracks / listens : 0,
  });
  const now = axes(
    div,
    activeDays,
    newArtists,
    c.current.artistCount ?? 0,
    c.current.listenCount ?? 0,
    c.current.recordingCount ?? 0,
  );
  const was = before
    ? axes(
        data.diversityBefore,
        before.activeDays,
        0,
        before.artistCount,
        before.listenCount,
        before.recordingCount,
      )
    : null;
  const hours = Math.round(cur.listeningTime.totalMs / 3_600_000);

  return (
    <ReportPage>
      <ReportNav
        rangeLabel={`${formatDate(c.from)} – ${formatDate(Math.min(c.to, Date.now() / 1000))}`}
        periods={[
          { value: "semaine", label: m.ds_the_week() },
          { value: "mois", label: m.ds_the_month() },
          { value: "annee", label: m.ds_the_year() },
        ]}
        period={period}
        onPeriod={(v: string) => go({ periode: v as ReportPeriod })}
        onPrev={past ? undefined : () => go({ periode: period, precedente: true })}
        onNext={past ? () => go({ periode: period }) : undefined}
      />
      <ReportHero
        count={c.current.listenCount ?? 0}
        unit={m.ds_scrobbles_unit()}
        deltaPercent={pct(c.changePercent.listenCount)}
        deltaLabel={m.ds_vs_previous({ period: prevLabel })}
        days={heroBars(data.current, data.previous, granularity, period === "semaine")}
        currentLabel={past ? prevLabel : m.ds_this_period()}
        previousLabel={prevLabel}
      />
      <div className="ap-rp__wrap ap-rp__body">
        <div className="ap-rp__grid3">
          <div className="ap-rp__col">
            <CategoryTile
              kind="artists"
              label={m.tab_artists()}
              value={c.current.artistCount ?? 0}
              deltaPercent={pct(c.changePercent.artistCount)}
            />
            {data.artists.items.length ? (
              <TopFeature
                kind="artists"
                chip={m.ds_top_artist()}
                items={data.artists.items.map((a, i) => ({
                  title: a.artist,
                  listenCount: a.listenCount,
                  imageUrl: i === 0 ? artistImage(a.artist) : undefined,
                }))}
              />
            ) : null}
            <ReportStat
              label={m.ds_new_artists()}
              value={`${share(newArtists, c.current.artistCount ?? 0)} %`}
              caption={m.ds_new_of({
                count: formatCount(newArtists),
                total: formatCount(c.current.artistCount ?? 0),
              })}
            />
            {data.discoveries.artists.items[0] ? (
              <ReportMini
                title={`#1 ${data.discoveries.artists.items[0].artistName}`}
                sub={m.ds_n_scrobbles({
                  count: formatCount(data.discoveries.artists.items[0].listenCount),
                })}
                coverUrl={artistImage(data.discoveries.artists.items[0].artistName, 250)}
              />
            ) : null}
          </div>
          <div className="ap-rp__col">
            <CategoryTile
              kind="albums"
              label={m.tab_albums()}
              value={c.current.releaseCount ?? 0}
              deltaPercent={pct(c.changePercent.releaseCount)}
            />
            {data.albums.items.length ? (
              <TopFeature
                kind="albums"
                chip={m.ds_top_album()}
                items={data.albums.items.map((a, i) => ({
                  title: a.album ?? "",
                  sub: a.artist,
                  listenCount: a.listenCount,
                  imageUrl: i === 0 ? coverUrl(a, 500) : undefined,
                }))}
              />
            ) : null}
            <ReportStat
              label={m.ds_played_once()}
              value={formatCount(data.oneShots.total)}
              unit={m.ds_tracks_unit()}
              caption={m.ds_share_of_tracks({
                pct: share(data.oneShots.total, c.current.recordingCount ?? 0),
              })}
            />
          </div>
          <div className="ap-rp__col">
            <CategoryTile
              kind="tracks"
              label={m.tab_tracks()}
              value={c.current.recordingCount ?? 0}
              deltaPercent={pct(c.changePercent.recordingCount)}
            />
            {data.tracks.items.length ? (
              <TopFeature
                kind="tracks"
                chip={m.ds_top_track()}
                items={data.tracks.items.map((t, i) => ({
                  title: t.track ?? "",
                  sub: t.artist,
                  listenCount: t.listenCount,
                  imageUrl: i === 0 ? coverUrl(t, 500) : undefined,
                }))}
              />
            ) : null}
            <ReportStat
              label={m.ds_new_tracks()}
              value={`${share(newTracks, c.current.recordingCount ?? 0)} %`}
              caption={m.ds_new_of({
                count: formatCount(newTracks),
                total: formatCount(c.current.recordingCount ?? 0),
              })}
            />
          </div>
        </div>
        <ReportSection title={m.ds_charts()}>
          <div className="ap-rp__grid2">
            <ReportPanel title={m.ds_music_volume()}>
              <CompareBars
                previousLabel={prevLabel}
                rows={[
                  {
                    kind: "tracks",
                    label: m.tab_tracks(),
                    current: c.current.recordingCount ?? 0,
                    previous: c.before.recordingCount ?? 0,
                  },
                  {
                    kind: "albums",
                    label: m.tab_albums(),
                    current: c.current.releaseCount ?? 0,
                    previous: c.before.releaseCount ?? 0,
                  },
                  {
                    kind: "artists",
                    label: m.tab_artists(),
                    current: c.current.artistCount ?? 0,
                    previous: c.before.artistCount ?? 0,
                  },
                ]}
              />
            </ReportPanel>
            <ReportPanel title={m.ds_fingerprint()}>
              <FingerprintRadar
                currentLabel={m.ds_this_period()}
                previousLabel={prevLabel}
                axes={[
                  {
                    label: m.ds_axis_constance(),
                    value: now.constance,
                    previous: was?.constance,
                    display: `${activeDays} j / ${spanDays}`,
                  },
                  { label: m.ds_axis_discovery(), value: now.discovery, previous: was?.discovery },
                  { label: m.ds_axis_variety(), value: now.variety, previous: was?.variety },
                  { label: m.ds_axis_focus(), value: now.focus, previous: was?.focus },
                  { label: m.ds_axis_replay(), value: now.replay, previous: was?.replay },
                ]}
              />
            </ReportPanel>
          </div>
          <div className="ap-rp__gap" />
          <div className="ap-rp__grid2">
            <ReportPanel title={m.ds_listening_clock()}>
              <HourClock hours={data.hours} />
            </ReportPanel>
            <ReportPanel title={m.ds_streak()}>
              <div>
                <StreakCard
                  current={{
                    days: data.streaks.current.days,
                    since: data.streaks.current.since ?? undefined,
                  }}
                  longest={{
                    days: data.streaks.longest?.days ?? 0,
                    from: data.streaks.longest?.from,
                    to: data.streaks.longest?.to,
                  }}
                  days={data.days}
                />
              </div>
            </ReportPanel>
          </div>
        </ReportSection>
        <ReportSection title={m.ds_in_short()}>
          <div className="ap-rp__grid3">
            <ReportStat
              label={m.ds_listening_time()}
              value={formatCount(hours)}
              unit={m.ds_hours_unit()}
              caption={m.ds_measured_on({
                count: formatCount(cur.listeningTime.listensWithDuration),
              })}
            />
            <ReportStat
              label={m.ds_average_scrobbles()}
              value={formatCount(Math.round(cur.averagePerDay))}
              unit={m.ds_per_day()}
              deltaPercent={
                before && before.averagePerDay
                  ? Math.round(
                      ((cur.averagePerDay - before.averagePerDay) / before.averagePerDay) * 100,
                    )
                  : undefined
              }
              caption={
                before
                  ? m.ds_against({
                      value: formatCount(Math.round(before.averagePerDay)),
                      period: prevLabel,
                    })
                  : undefined
              }
            />
            {cur.busiestDay ? (
              <ReportStat
                label={m.ds_peak_day()}
                value={formatCount(cur.busiestDay.listenCount)}
                unit={formatDayMonth(parseDay(cur.busiestDay.date).getTime() / 1000)}
                deltaPercent={
                  before?.busiestDay
                    ? Math.round(
                        ((cur.busiestDay.listenCount - before.busiestDay.listenCount) /
                          before.busiestDay.listenCount) *
                          100,
                      )
                    : undefined
                }
                caption={
                  before?.busiestDay
                    ? m.ds_against({
                        value: formatCount(before.busiestDay.listenCount),
                        period: prevLabel,
                      })
                    : undefined
                }
              />
            ) : null}
          </div>
        </ReportSection>
      </div>
    </ReportPage>
  );
}
