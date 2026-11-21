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
      label: "Jour le plus chargé",
      value: formatDayString(w.busiestDay.date),
      detail: `${formatCount(w.busiestDay.listenCount)} écoutes`,
    },
    w.busiestMonth && {
      label: "Mois le plus chargé",
      value: formatMonthName(w.busiestMonth.month),
      detail: `${formatCount(w.busiestMonth.listenCount)} écoutes`,
    },
    w.favouriteHour && {
      label: "Heure préférée",
      value: `${w.favouriteHour.hour} h`,
      detail: `${formatCount(w.favouriteHour.listenCount)} écoutes entre ${w.favouriteHour.hour} h et ${(w.favouriteHour.hour + 1) % 24} h`,
    },
    w.longestSession && {
      label: "Plus longue session",
      value: formatDuration(w.longestSession.endedAt - w.longestSession.startedAt),
      detail: `${formatCount(w.longestSession.listenCount)} écoutes, le ${formatDayMonth(w.longestSession.startedAt)} de ${formatTime(w.longestSession.startedAt)} à ${formatTime(w.longestSession.endedAt)}`,
    },
    w.longestStreakDays > 0 && {
      label: "Plus longue série",
      value: formatDays(w.longestStreakDays),
      detail: "d'écoute d'affilée",
    },
  ].filter((m): m is { label: string; value: string; detail: string } => Boolean(m));

  return (
    <Main gap={32} padding="16px 24px 64px">
      <Breadcrumbs
        items={[
          <Link key="s" to="/u/$userName/stats" params={{ userName }}>
            Stats
          </Link>,
          "Bilan annuel",
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
          <h1 className={css({ m: 0, textStyle: "pageTitle" })}>Bilan {w.year}</h1>
          <SelectMenu<string>
            label="Année"
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
            En {w.year}, tu as écouté{" "}
            <b className={css({ color: "ink", fontWeight: "600" })}>
              {formatCount(w.listenCount)} titres
            </b>
            {hours > 0 ? (
              <>
                {" "}
                pendant{" "}
                <b className={css({ color: "ink", fontWeight: "600" })}>
                  {formatCount(hours)} heures
                </b>
              </>
            ) : null}
            .
          </p>
          <span className={muted}>
            {ongoing ? "Du 1er janvier à aujourd'hui" : `Du 1er janvier au 31 décembre ${w.year}`}
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
          <Stat value={formatCount(w.listenCount)} label="ÉCOUTES" />
          <Stat value={formatCount(w.artistCount)} label="ARTISTES" />
          <Stat value={formatCount(w.recordingCount)} label="TITRES" />
          <Stat value={formatCount(w.releaseCount)} label="ALBUMS" />
          <Stat value={formatCount(w.activeDays)} label="JOURS ACTIFS" />
          <Stat value={formatDays(w.longestStreakDays)} label="PLUS LONGUE SÉRIE" />
        </div>
      </section>

      {w.listenCount === 0 ? (
        <Empty>Aucune écoute cette année-là.</Empty>
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
                <BlockTitle title="Top artistes" />
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
                <BlockTitle title="Top titres" />
                <TrackRanking userName={userName} items={w.topTracks.slice(0, 5)} />
              </section>
            ) : null}
            {w.topAlbums.length ? (
              <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
                <BlockTitle title="Top albums" />
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
                  <h2 className={css({ m: 0, textStyle: "block" })}>Meilleures découvertes</h2>
                  <span className={muted}>
                    {formatCount(w.newArtists)} artistes et {formatCount(w.newTracks)} titres
                    découverts
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
                        {d.trackName ? `Titre · ${d.artistName}` : "Artiste"}
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
                      <span>{formatCount(d.listenCount)} écoutes</span>
                      <span className={css({ color: "muted" })}>
                        depuis le {formatDayMonth(d.firstListenedAt)}
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
                <h2 className={css({ m: 0, pb: "10px", textStyle: "block" })}>Les moments</h2>
                {moments.map((m) => (
                  <div
                    key={m.label}
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
                      <span className={css({ color: "muted" })}>{m.label}</span>
                      <span className={css({ fontWeight: "500" })}>{m.value}</span>
                    </span>
                    <span className={css({ fontSize: "12px", color: "muted", textAlign: "right" })}>
                      {m.detail}
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
                  À ton heure locale. Une session, ce sont des écoutes à moins de 30 min d'écart.
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
                  Tes stats du moment
                </span>
                <span className={muted}>Ce mois-ci, jour par jour</span>
              </span>
              <ChevronRight size={16} />
            </Link>
          </aside>
        </div>
      )}
    </Main>
  );
}
