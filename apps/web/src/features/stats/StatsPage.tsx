import { Link, useNavigate } from "@tanstack/react-router";
import { css } from "styled-system/css";
import type { Range } from "../../api/index.ts";
import {
  formatChange,
  formatCount,
  formatDayMonth,
  formatDays,
  localDate,
} from "../../lib/format/index.ts";
import { estimateListeningMs } from "../../lib/listening-time.ts";
import { dateFormat } from "../../lib/locale.ts";
import { rangeOptions } from "../../lib/ranges.ts";
import { AxisLabels } from "../../ui/charts/index.ts";
import { ArtistCover } from "../../ui/cover/index.ts";
import { ChevronRight } from "../../ui/icons.tsx";
import { Main } from "../../ui/layout/index.ts";
import { pageTitle, sectionTitle, Stat } from "../../ui/primitives/index.ts";
import { color } from "../../ui/theme/index.ts";
import { SelectMenu } from "../../ui/zag/index.ts";
import { AlbumGrid, ArtistGrid, BlockTitle, moreLink, TrackRanking } from "../tops/index.ts";
import { rangeSentence, weekdayName } from "./copy.ts";
import { Daily } from "./Daily.tsx";
import type { StatsData } from "./data.ts";
import { m } from "../../paraglide/messages.js";

const monthName = () => dateFormat({ month: "long", timeZone: "UTC" });

/** "vs octobre", "vs 2025", "vs la semaine d'avant"… for the change figure. */
function versus(range: Range, from: number): string {
  const before = localDate(from - 86_400);
  if (range === "this_month" || range === "month")
    return m.versus({ what: monthName().format(before) }).toUpperCase();
  if (range === "this_year" || range === "year")
    return m.versus({ what: String(before.getUTCFullYear()) }).toUpperCase();
  return m.versus_before();
}

const aside = css({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  pt: "16px",
  borderTop: "1px solid token(colors.rule)",
});

/** The stats page (board "Écran · Stats"): headline, totals, days, tops, hours, streak, discoveries. */
export function StatsPage({
  userName,
  range,
  data,
}: {
  userName: string;
  range: Range;
  data: StatsData;
}) {
  const navigate = useNavigate();
  const { summary, compare, clock, streaks, discoveries } = data;
  const hours = Math.round(
    estimateListeningMs(
      summary.listenCount,
      summary.listeningTime.totalMs,
      summary.listeningTime.listensWithDuration,
    ) / 3_600_000,
  );
  const days = Math.max(
    1,
    Math.ceil(
      (summary.to - (summary.from > 0 ? summary.from : (summary.firstListenedAt ?? summary.to))) /
        86_400,
    ),
  );
  const change = compare?.changePercent.listenCount;
  const hourCounts = Array.from(
    { length: 24 },
    (_, h) => clock.hours.find((x) => x.hour === h)?.listenCount ?? 0,
  );
  const hourMax = Math.max(1, ...hourCounts);
  const favourite = hourCounts.indexOf(Math.max(...hourCounts));
  const busiestDay = clock.weekdays.reduce<{ weekday: string; listenCount: number } | null>(
    (b, w) => (!b || w.listenCount > b.listenCount ? w : b),
    null,
  );
  const year = localDate(summary.to).getUTCFullYear();
  const more = (kind: "artistes" | "titres" | "albums", label: string) => (
    <Link
      to="/u/$userName/tops/$kind"
      params={{ userName, kind }}
      search={{ periode: range }}
      className={moreLink}
    >
      {label}
      <ChevronRight size={14} />
    </Link>
  );

  return (
    <Main gap={32} padding="16px 24px 64px">
      <section className={css({ display: "flex", flexDirection: "column", gap: "20px" })}>
        <div
          className={css({
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          })}
        >
          <h1 className={pageTitle}>{m.nav_stats()}</h1>
          <SelectMenu<Range>
            label={m.period()}
            value={range}
            options={rangeOptions()}
            onValueChange={(periode) =>
              void navigate({
                to: "/u/$userName/stats",
                params: { userName },
                search: { periode },
                resetScroll: false,
              })
            }
          />
        </div>
        <p
          className={css({
            m: 0,
            fontSize: "24px",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            color: "muted",
          })}
        >
          {m.you_listened({ when: rangeSentence(range) })}{" "}
          <b className={css({ color: "ink", fontWeight: "600" })}>
            {m.count_tracks({ count: formatCount(summary.listenCount) })}
          </b>
          {hours > 0 ? (
            <>
              {" "}
              {m.during()}{" "}
              <b className={css({ color: "ink", fontWeight: "600" })}>
                {m.count_hours({ count: formatCount(hours) })}
              </b>
            </>
          ) : null}
          .
        </p>
        <div
          className={css({
            display: "flex",
            flexWrap: "wrap",
            gap: "28px",
            py: "16px",
            borderTop: "1px solid token(colors.rule)",
            borderBottom: "1px solid token(colors.rule)",
          })}
        >
          <Stat value={formatCount(summary.listenCount)} label={m.caps_listens()} />
          <Stat value={formatCount(summary.artistCount)} label={m.caps_artists()} />
          <Stat value={formatCount(summary.recordingCount)} label={m.caps_tracks()} />
          <Stat
            value={`${formatCount(summary.activeDays)} sur ${formatCount(days)}`}
            label={m.caps_active_days()}
          />
          {change !== null && change !== undefined ? (
            <Stat
              value={
                <span style={{ color: change >= 0 ? color("up") : color("danger") }}>
                  {formatChange(change)}
                </span>
              }
              label={versus(range, summary.from)}
            />
          ) : null}
        </div>
      </section>

      <div
        className={css({
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          alignItems: "flex-start",
        })}
      >
        <div
          className={css({
            flex: "999 1 520px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "40px",
          })}
        >
          <Daily activity={data.activity} range={range} />
          {data.artists.items.length ? (
            <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
              <BlockTitle
                title={m.top_artists()}
                more={more("artistes", m.all_artists({ count: formatCount(data.artists.total) }))}
              />
              <ArtistGrid
                userName={userName}
                items={data.artists.items.map((a) => ({
                  artist: a.artist,
                  listenCount: a.listenCount,
                }))}
              />
            </section>
          ) : null}
          {data.tracks.items.length ? (
            <section className={css({ display: "flex", flexDirection: "column", gap: "10px" })}>
              <BlockTitle
                title={m.top_tracks()}
                more={more("titres", m.all_tracks({ count: formatCount(data.tracks.total) }))}
              />
              <TrackRanking
                userName={userName}
                items={data.tracks.items.map((t) => ({
                  artist: t.artist,
                  track: t.track ?? "",
                  album: t.album,
                  listenCount: t.listenCount,
                  mbid: t.mbids?.release,
                }))}
              />
            </section>
          ) : null}
          {data.albums.items.length ? (
            <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
              <BlockTitle
                title={m.top_albums()}
                more={more("albums", m.all_albums({ count: formatCount(data.albums.total) }))}
              />
              <AlbumGrid
                userName={userName}
                items={data.albums.items.map((a) => ({
                  artist: a.artist,
                  album: a.album ?? "",
                  listenCount: a.listenCount,
                  mbid: a.mbids?.release,
                }))}
              />
            </section>
          ) : null}
        </div>

        <aside
          className={css({
            flex: "1 1 240px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          })}
        >
          {hourCounts.some((n) => n > 0) ? (
            <section className={css({ display: "flex", flexDirection: "column", gap: "12px" })}>
              <h2 className={sectionTitle}>{m.when_you_listen()}</h2>
              <div
                role="img"
                aria-label={m.hours_aria({ hour: favourite })}
                className={css({
                  height: "64px",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "2px",
                  borderBottom: "1px solid token(colors.rule)",
                })}
              >
                {hourCounts.map((n, h) => (
                  <div
                    key={h}
                    title={m.hour_listens({ hour: h, count: formatCount(n) })}
                    className={css({ flex: 1, minHeight: "2px" })}
                    style={{
                      height: `${Math.max(2, Math.round((n / hourMax) * 100))}%`,
                      background: h === favourite ? color("ink") : color("yellow"),
                    }}
                  />
                ))}
              </div>
              <AxisLabels items={[0, 12, 23].map((hour) => m.hour_short({ hour }))} />
              <span className={css({ fontSize: "13px" })}>
                {m.mostly_around()}{" "}
                <b className={css({ fontWeight: "600" })}>{m.hour_short({ hour: favourite })}</b>
                {busiestDay && busiestDay.listenCount > 0 ? (
                  <>
                    {m.and_on()}{" "}
                    <b className={css({ fontWeight: "600" })}>{weekdayName(busiestDay.weekday)}</b>
                  </>
                ) : null}
                .
              </span>
            </section>
          ) : null}

          <section
            className={css({
              display: "flex",
              gap: "28px",
              pt: "16px",
              borderTop: "1px solid token(colors.rule)",
            })}
          >
            <Stat value={formatDays(streaks.current.days)} label={m.streak_current()} />
            <Stat value={formatDays(streaks.longest?.days ?? 0)} label={m.streak_record()} />
          </section>

          {discoveries.artists.items.length ? (
            <section className={aside} style={{ gap: 10 }}>
              <div
                className={css({
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                })}
              >
                <h2 className={sectionTitle}>{m.discoveries()}</h2>
                <span className={css({ fontSize: "12px", color: "muted" })}>
                  {m.count_artists({ count: formatCount(discoveries.artists.total) })}
                </span>
              </div>
              {discoveries.artists.items.map((d) => (
                <Link
                  key={d.artistName}
                  to="/u/$userName/artistes/$artist"
                  params={{ userName, artist: d.artistName }}
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: "none",
                  })}
                >
                  <ArtistCover artist={d.artistName} size={32} />
                  <span
                    className={css({
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "1px",
                    })}
                  >
                    <span className={css({ fontSize: "13px", fontWeight: "500" })}>
                      {d.artistName}
                    </span>
                    <span className={css({ fontSize: "12px", color: "muted" })}>
                      {m.since_date({ date: formatDayMonth(d.firstListenedAt) })} ·{" "}
                      {m.count_listens({ count: formatCount(d.listenCount) })}
                    </span>
                  </span>
                </Link>
              ))}
            </section>
          ) : null}

          <Link
            to="/u/$userName/bilan"
            params={{ userName }}
            search={{ annee: year }}
            className={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              px: "16px",
              py: "14px",
              borderRadius: "card",
              bg: "panel",
              textDecoration: "none",
            })}
          >
            <span className={css({ display: "flex", flexDirection: "column", gap: "2px" })}>
              <span className={css({ fontSize: "13px", fontWeight: "600" })}>
                {m.your_year({ year })}
              </span>
              <span className={css({ fontSize: "12px", color: "muted" })}>{m.full_review()}</span>
            </span>
            <ChevronRight size={16} />
          </Link>
        </aside>
      </div>
    </Main>
  );
}
