import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { css } from "styled-system/css";
import type { Wrapped } from "../../api/index.ts";
import {
  formatCount,
  formatDate,
  formatDayMonth,
  formatDayString,
  formatDuration,
  formatMonthName,
  formatShare,
  formatTime,
} from "../../lib/format/index.ts";
import { Main } from "../../ui/layout/index.ts";
import { capsLabel, pill } from "../../ui/primitives/index.ts";
import { AlbumCover, ArtistCover } from "../../ui/cover/index.ts";

const narrow = css({ textStyle: "narrow" });
const rankRow = css({
  display: "flex",
  alignItems: "center",
  gap: "14px",
  py: "10px",
  borderTop: "1px solid token(colors.ruleSoft)",
  textDecoration: "none",
});
const rank = css({ width: "22px", textStyle: "narrow", fontSize: "20px" });
const muted = css({ fontSize: "12px", color: "muted" });

function Section({
  title,
  className,
  children,
}: {
  title: ReactNode;
  className: string;
  children: ReactNode;
}) {
  return (
    <section className={css({ display: "flex", flexDirection: "column", gap: "16px" })}>
      <h2 className={className}>{title}</h2>
      {children}
    </section>
  );
}

/** "Bilan annuel": a year in review, from GET /stats/wrapped. */
export function WrappedPage({
  userName,
  wrapped: w,
  firstYear,
}: {
  userName: string;
  wrapped: Wrapped;
  firstYear: number;
}) {
  const thisYear = new Date().getUTCFullYear();
  const years = Array.from(
    { length: Math.max(1, thisYear - firstYear + 1) },
    (_, i) => thisYear - i,
  );
  const hours = Math.round(w.listeningTimeMs / 3_600_000);
  const [top, ...next] = w.topArtists;
  const totals = [
    { value: formatCount(w.listenCount), label: "écoutes" },
    { value: formatCount(w.artistCount), label: "artistes" },
    { value: formatCount(w.recordingCount), label: "titres différents" },
    { value: formatCount(w.releaseCount), label: "albums différents" },
    ...(hours > 0
      ? [
          {
            value: `${formatCount(hours)} h`,
            label: `d'écoute, soit ${formatCount(Math.round(hours / 24))} jours`,
          },
        ]
      : []),
    { value: formatCount(w.activeDays), label: "jours actifs" },
  ];
  const moments = [
    w.busiestDay && {
      label: "JOUR LE PLUS CHARGÉ",
      value: formatDayString(w.busiestDay.date),
      detail: `${formatCount(w.busiestDay.listenCount)} écoutes ce jour-là`,
    },
    w.busiestMonth && {
      label: "MOIS LE PLUS CHARGÉ",
      value: formatMonthName(w.busiestMonth.month),
      detail: `${formatCount(w.busiestMonth.listenCount)} écoutes`,
    },
    w.favouriteHour && {
      label: "HEURE PRÉFÉRÉE",
      value: `${w.favouriteHour.hour} h`,
      detail: `${formatCount(w.favouriteHour.listenCount)} écoutes entre ${w.favouriteHour.hour} h et ${(w.favouriteHour.hour + 1) % 24} h`,
    },
    w.longestSession && {
      label: "PLUS LONGUE SESSION",
      value: formatDuration(w.longestSession.endedAt - w.longestSession.startedAt),
      detail: `${formatCount(w.longestSession.listenCount)} écoutes, le ${formatDayMonth(w.longestSession.startedAt)} de ${formatTime(w.longestSession.startedAt)} à ${formatTime(w.longestSession.endedAt)}`,
    },
    w.longestStreakDays > 0 && {
      label: "PLUS LONGUE SÉRIE",
      value: `${w.longestStreakDays} jours`,
      detail: "d'écoute d'affilée",
    },
  ].filter((m): m is { label: string; value: string; detail: string } => Boolean(m));

  return (
    <Main gap={64}>
      <section className={css({ display: "flex", flexDirection: "column", gap: "20px" })}>
        <div
          role="tablist"
          aria-label="Année"
          className={css({ display: "flex", flexWrap: "wrap", gap: "6px" })}
        >
          {years.map((y) => (
            <Link
              key={y}
              to="/u/$userName/bilan"
              params={{ userName }}
              search={{ annee: y }}
              role="tab"
              aria-selected={y === w.year}
              className={pill({ tone: y === w.year ? "on" : "off" })}
            >
              {y}
            </Link>
          ))}
        </div>
        <h1
          className={css({
            m: 0,
            textStyle: "wide",
            fontWeight: "900",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
          })}
          style={{ fontSize: "clamp(96px, 18vw, 220px)" }}
        >
          {w.year}
        </h1>
        <p
          className={css({ m: 0, textStyle: "serif", lineHeight: 1.1 })}
          style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
        >
          Une année de musique, écoute par écoute.
        </p>
        {w.firstListenedAt ? (
          <span className={muted}>
            Du {formatDate(w.firstListenedAt)} au {formatDate(w.lastListenedAt ?? w.to)}
          </span>
        ) : null}
      </section>

      {w.listenCount === 0 ? (
        <p className={muted}>Aucune écoute cette année-là.</p>
      ) : (
        <>
          <section
            className={css({
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "32px 24px",
              py: "32px",
              borderTop: "2px solid token(colors.ink)",
              borderBottom: "1px solid token(colors.rule)",
            })}
          >
            {totals.map((t) => (
              <div
                key={t.label}
                className={css({ display: "flex", flexDirection: "column", gap: "6px" })}
              >
                <span className={narrow} style={{ fontSize: 56, lineHeight: 0.95 }}>
                  {t.value}
                </span>
                <span className={css({ fontSize: "13px", color: "muted" })}>{t.label}</span>
              </div>
            ))}
          </section>

          {top ? (
            <section
              className={css({
                display: "flex",
                flexWrap: "wrap",
                gap: "40px",
                alignItems: "flex-start",
              })}
            >
              <div
                className={css({
                  flex: "1 1 320px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                })}
              >
                <h2 className={css({ m: 0, textStyle: "narrow", fontSize: "36px", lineHeight: 1 })}>
                  Ton artiste de l'année
                </h2>
                <Link
                  to="/u/$userName/artistes/$artist"
                  params={{ userName, artist: top.artist }}
                  className={css({ display: "block", width: "100%", maxWidth: "360px" })}
                >
                  <ArtistCover artist={top.artist} />
                </Link>
                <div className={css({ display: "flex", flexDirection: "column", gap: "4px" })}>
                  <span
                    className={css({
                      fontSize: "32px",
                      fontWeight: "500",
                      letterSpacing: "-0.015em",
                    })}
                  >
                    {top.artist}
                  </span>
                  <span className={css({ fontSize: "13px", color: "muted" })}>
                    {formatCount(top.listenCount)} écoutes ·{" "}
                    {formatShare(top.listenCount / w.listenCount)} de ton année
                  </span>
                </div>
              </div>
              {next.length ? (
                <div
                  className={css({ flex: "1 1 320px", display: "flex", flexDirection: "column" })}
                >
                  <h2 className={css({ m: "0 0 12px", textStyle: "block" })}>Juste derrière</h2>
                  {next.slice(0, 4).map((a, i) => (
                    <Link
                      key={a.artist}
                      to="/u/$userName/artistes/$artist"
                      params={{ userName, artist: a.artist }}
                      className={rankRow}
                    >
                      <span className={rank}>{i + 2}</span>
                      <ArtistCover artist={a.artist} size={32} />
                      <span className={css({ flex: 1, fontSize: "13px", fontWeight: "500" })}>
                        {a.artist}
                      </span>
                      <span className={muted}>{formatCount(a.listenCount)} écoutes</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {w.topAlbums.length ? (
            <Section
              title="Tes albums"
              className={css({ m: 0, textStyle: "serif", fontSize: "36px", lineHeight: 1 })}
            >
              <div
                className={css({
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "16px",
                })}
              >
                {w.topAlbums.slice(0, 5).map((a, i) => (
                  <Link
                    key={`${a.artist}/${a.album}`}
                    to="/u/$userName/albums/$artist/$album"
                    params={{ userName, artist: a.artist, album: a.album }}
                    className={css({
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      textDecoration: "none",
                    })}
                  >
                    <AlbumCover artist={a.artist} album={a.album} title={a.album} />
                    <span
                      className={css({
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        fontSize: "12px",
                      })}
                    >
                      <span className={css({ color: "muted" })}>{i + 1}.</span>
                      <span>{a.album}</span>
                      <span className={css({ color: "muted" })}>
                        {a.artist} · {formatCount(a.listenCount)} écoutes
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          ) : null}

          {w.topTracks.length ? (
            <section className={css({ display: "flex", flexDirection: "column" })}>
              <h2
                className={css({
                  m: "0 0 12px",
                  textStyle: "narrow",
                  fontSize: "36px",
                  lineHeight: 1,
                })}
              >
                Tes titres
              </h2>
              {w.topTracks.slice(0, 5).map((t, i) => (
                <Link
                  key={`${t.artist}/${t.track}`}
                  to="/u/$userName/titres/$artist/$track"
                  params={{ userName, artist: t.artist, track: t.track }}
                  className={rankRow}
                >
                  <span className={rank}>{i + 1}</span>
                  <span
                    className={css({
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    })}
                  >
                    <span className={css({ fontSize: "13px", fontWeight: "500" })}>{t.track}</span>
                    <span className={muted}>{t.artist}</span>
                  </span>
                  <span className={muted}>{formatCount(t.listenCount)} écoutes</span>
                </Link>
              ))}
            </section>
          ) : null}

          {moments.length ? (
            <section className={css({ display: "flex", flexDirection: "column", gap: "16px" })}>
              <h2 className={css({ m: 0, textStyle: "wide", fontSize: "22px", lineHeight: 1 })}>
                Les moments
              </h2>
              <span className={muted} style={{ marginTop: -8 }}>
                À ton heure locale. Une session, ce sont des écoutes à moins de 30 min d'écart.
              </span>
              <div
                className={css({
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "16px",
                })}
              >
                {moments.map((m) => (
                  <div
                    key={m.label}
                    className={css({
                      p: "20px",
                      bg: "panel",
                      borderRadius: "card",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    })}
                  >
                    <span className={capsLabel}>{m.label}</span>
                    <span className={narrow} style={{ fontSize: 32, lineHeight: 1 }}>
                      {m.value}
                    </span>
                    <span className={muted}>{m.detail}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {w.newArtists + w.newTracks > 0 ? (
            <section
              className={css({
                display: "flex",
                flexWrap: "wrap",
                gap: "32px 48px",
                p: "32px",
                bg: "ink",
                color: "page",
              })}
            >
              <div
                className={css({
                  flex: "1 1 280px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                })}
              >
                <span className={capsLabel} style={{ color: "#BDBDBD" }}>
                  NOUVEAUTÉS DE L'ANNÉE
                </span>
                <span className={css({ textStyle: "wide", fontSize: "32px", lineHeight: 1.05 })}>
                  {formatCount(w.newArtists)} artistes et {formatCount(w.newTracks)} titres entendus
                  pour la première fois.
                </span>
              </div>
              {w.topDiscoveries.length ? (
                <div
                  className={css({ flex: "1 1 360px", display: "flex", flexDirection: "column" })}
                >
                  <span className={css({ pb: "8px", fontSize: "13px", fontWeight: "600" })}>
                    Tes meilleures découvertes
                  </span>
                  {w.topDiscoveries.slice(0, 5).map((d) => (
                    <Link
                      key={`${d.artistName}/${d.trackName}`}
                      to="/u/$userName/artistes/$artist"
                      params={{ userName, artist: d.artistName }}
                      className={css({
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        py: "10px",
                        borderTop: "1px solid token(colors.nightRule)",
                        color: "page",
                        textDecoration: "none",
                        _hover: { color: "page" },
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
                        <span className={css({ fontSize: "12px", color: "nightMuted" })}>
                          {d.trackName
                            ? [d.artistName, d.releaseName].filter(Boolean).join(" · ")
                            : "Artiste"}
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
                        <span className={css({ color: "nightMuted" })}>
                          depuis le {formatDayMonth(d.firstListenedAt)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </Main>
  );
}
