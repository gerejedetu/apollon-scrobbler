import { Link, useNavigate } from "@tanstack/react-router";
import { css } from "styled-system/css";
import type { Wrapped } from "../../api/index.ts";
import {
  formatCount,
  formatDayMonth,
  formatDayString,
  formatDays,
  formatDuration,
  formatMonthName,
  formatTime,
} from "../../lib/format/index.ts";
import { estimateFromTotal } from "../../lib/listening-time.ts";
import { AlbumCover, ArtistCover } from "../../ui/cover/index.ts";
import { ChevronRight } from "../../ui/icons.tsx";
import { Breadcrumbs, Main } from "../../ui/layout/index.ts";
import { Empty, Stat } from "../../ui/primitives/index.ts";
import { SelectMenu } from "../../ui/zag/index.ts";
import { AlbumGrid, ArtistGrid, BlockTitle, TrackRanking } from "../tops/index.ts";
import { m } from "../../paraglide/messages.js";

const muted = css({ fontSize: "12px", color: "muted" });

/** "Bilan annuel" (board "Écran · Bilan annuel"), from GET /stats/wrapped. */
export function WrappedPage({
  userName,
  wrapped: w,
  firstYear,
}: {
  userName: string;
  wrapped: Wrapped;
  firstYear: number;
}) {
  const navigate = useNavigate();
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: Math.max(1, thisYear - firstYear + 1) }, (_, i) =>
    String(thisYear - i),
  );
  const hours = Math.round(estimateFromTotal(w.listenCount, w.listeningTimeMs) / 3_600_000);
  const ongoing = w.year === thisYear;
  const moments = [
    w.busiestDay && {
      label: m.moment_busiest_day(),
      value: formatDayString(w.busiestDay.date),
      detail: m.count_listens({ count: formatCount(w.busiestDay.listenCount) }),
    },
    w.busiestMonth && {
      label: m.moment_busiest_month(),
      value: formatMonthName(w.busiestMonth.month),
      detail: m.count_listens({ count: formatCount(w.busiestMonth.listenCount) }),
    },
    w.favouriteHour && {
      label: m.moment_favourite_hour(),
      value: m.hour_of_day({ hour: w.favouriteHour.hour }),
      detail: m.moment_hour_detail({
        count: formatCount(w.favouriteHour.listenCount),
        from: w.favouriteHour.hour,
        to: (w.favouriteHour.hour + 1) % 24,
      }),
    },
    w.longestSession && {
      label: m.moment_longest_session(),
      value: formatDuration(w.longestSession.endedAt - w.longestSession.startedAt),
      detail: m.moment_session_detail({
        count: formatCount(w.longestSession.listenCount),
        day: formatDayMonth(w.longestSession.startedAt),
        from: formatTime(w.longestSession.startedAt),
        to: formatTime(w.longestSession.endedAt),
      }),
    },
    w.longestStreakDays > 0 && {
      label: m.moment_longest_streak(),
      value: formatDays(w.longestStreakDays),
      detail: m.moment_streak_detail(),
    },
  ].filter((x): x is Exclude<typeof x, false | null | undefined | 0> => Boolean(x));

  return (
    <Main gap={32} padding="16px 24px 64px">
      <Breadcrumbs
        items={[
          <Link key="s" to="/u/$userName/stats" params={{ userName }}>
            {m.nav_stats()}
          </Link>,
          m.wrapped_title(),
        ]}
      />
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
          <h1 className={css({ m: 0, textStyle: "pageTitle" })}>
            {m.wrapped_heading({ year: w.year })}
          </h1>
          <SelectMenu<string>
            label={m.year_label()}
            value={String(w.year)}
            options={years.map((y) => ({ value: y, label: y }))}
            onValueChange={(y) =>
              void navigate({
                to: "/u/$userName/bilan",
                params: { userName },
                search: { annee: Number(y) },
              })
            }
          />
        </div>
        <div className={css({ display: "flex", flexDirection: "column", gap: "6px" })}>
          <p
            className={css({
              m: 0,
              fontSize: "24px",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              color: "muted",
            })}
          >
            {m.you_listened({ when: m.in_year({ year: w.year }) })}{" "}
            <b className={css({ color: "ink", fontWeight: "600" })}>
              {m.count_tracks({ count: formatCount(w.listenCount) })}
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
          <span className={muted}>
            {ongoing ? m.wrapped_span_ongoing() : m.wrapped_span({ year: w.year })}
          </span>
        </div>
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
          <Stat value={formatCount(w.listenCount)} label={m.caps_listens()} />
          <Stat value={formatCount(w.artistCount)} label={m.caps_artists()} />
          <Stat value={formatCount(w.recordingCount)} label={m.caps_tracks()} />
          <Stat value={formatCount(w.releaseCount)} label={m.caps_albums()} />
          <Stat value={formatCount(w.activeDays)} label={m.caps_active_days()} />
          <Stat value={formatDays(w.longestStreakDays)} label={m.caps_longest_streak()} />
        </div>
      </section>

      {w.listenCount === 0 ? (
        <Empty>{m.wrapped_empty()}</Empty>
      ) : (
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
            {w.topArtists.length ? (
              <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
                <BlockTitle title={m.top_artists()} />
                <ArtistGrid
                  userName={userName}
                  items={w.topArtists
                    .slice(0, 5)
                    .map((a) => ({ artist: a.artist, listenCount: a.listenCount }))}
                />
              </section>
            ) : null}
            {w.topTracks.length ? (
              <section className={css({ display: "flex", flexDirection: "column", gap: "10px" })}>
                <BlockTitle title={m.top_tracks()} />
                <TrackRanking userName={userName} items={w.topTracks.slice(0, 5)} />
              </section>
            ) : null}
            {w.topAlbums.length ? (
              <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
                <BlockTitle title={m.top_albums()} />
                <AlbumGrid userName={userName} items={w.topAlbums.slice(0, 5)} />
              </section>
            ) : null}
            {w.topDiscoveries.length ? (
              <section className={css({ display: "flex", flexDirection: "column" })}>
                <div
                  className={css({
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "8px",
                    pb: "10px",
                  })}
                >
                  <h2 className={css({ m: 0, textStyle: "block" })}>{m.best_discoveries()}</h2>
                  <span className={muted}>
                    {m.discovered_counts({
                      artists: formatCount(w.newArtists),
                      tracks: formatCount(w.newTracks),
                    })}
                  </span>
                </div>
                {w.topDiscoveries.slice(0, 5).map((d) => (
                  <Link
                    key={`${d.artistName}/${d.trackName}`}
                    {...(d.trackName
                      ? ({
                          to: "/u/$userName/titres/$artist/$track",
                          params: { userName, artist: d.artistName, track: d.trackName },
                        } as const)
                      : ({
                          to: "/u/$userName/artistes/$artist",
                          params: { userName, artist: d.artistName },
                        } as const))}
                    className={css({
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      py: "10px",
                      borderTop: "1px solid token(colors.ruleSoft)",
                      textDecoration: "none",
                    })}
                  >
                    {d.trackName ? (
                      <AlbumCover
                        artist={d.artistName}
                        album={d.releaseName}
                        track={d.trackName}
                        size={36}
                      />
                    ) : (
                      <ArtistCover artist={d.artistName} size={36} />
                    )}
                    <span
                      className={css({
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      })}
                    >
                      <span className={css({ fontSize: "13px", fontWeight: "500" })}>
                        {d.trackName ?? d.artistName}
                      </span>
                      <span className={muted}>
                        {d.trackName ? m.track_by({ artist: d.artistName }) : m.kind_artist()}
                      </span>
                    </span>
                    <span
                      className={css({
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "2px",
                        fontSize: "12px",
                      })}
                    >
                      <span>{m.count_listens({ count: formatCount(d.listenCount) })}</span>
                      <span className={css({ color: "muted" })}>
                        {m.since_day({ day: formatDayMonth(d.firstListenedAt) })}
                      </span>
                    </span>
                  </Link>
                ))}
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
            {moments.length ? (
              <section
                className={css({ display: "flex", flexDirection: "column", fontSize: "13px" })}
              >
                <h2 className={css({ m: 0, pb: "10px", textStyle: "block" })}>
                  {m.moments_title()}
                </h2>
                {moments.map((moment) => (
                  <div
                    key={moment.label}
                    className={css({
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      py: "10px",
                      borderTop: "1px solid token(colors.ruleSoft)",
                    })}
                  >
                    <span
                      className={css({
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                      })}
                    >
                      <span className={css({ color: "muted" })}>{moment.label}</span>
                      <span className={css({ fontWeight: "500" })}>{moment.value}</span>
                    </span>
                    <span className={css({ fontSize: "12px", color: "muted", textAlign: "right" })}>
                      {moment.detail}
                    </span>
                  </div>
                ))}
                <span
                  className={css({
                    pt: "8px",
                    fontSize: "11px",
                    lineHeight: "16px",
                    color: "muted",
                  })}
                >
                  {m.moments_note()}
                </span>
              </section>
            ) : null}
            <Link
              to="/u/$userName/stats"
              params={{ userName }}
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
                  {m.current_stats()}
                </span>
                <span className={muted}>{m.this_month_daily()}</span>
              </span>
              <ChevronRight size={16} />
            </Link>
          </aside>
        </div>
      )}
    </Main>
  );
}
