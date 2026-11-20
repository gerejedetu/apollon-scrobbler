import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";
import type { Discoveries, Forgotten, OnThisDay } from "../../api/index.ts";
import {
  formatCount,
  formatDayMonth,
  formatDayString,
  formatMonthYear,
} from "../../lib/format/index.ts";
import { displayHeading, NewTag } from "../../ui/primitives/index.ts";
import { AlbumCover, ArtistCover } from "../listens/index.ts";

const heading = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: "8px",
});
const aside = css({ fontSize: "12px", color: "muted" });

/** "Premières fois": artists (or, without any, tracks) heard for the first time in the range. */
export function FirstTimes({
  userName,
  discoveries,
}: {
  userName: string;
  discoveries: Discoveries;
}) {
  const items = discoveries.artists.items.length
    ? discoveries.artists.items
    : discoveries.tracks.items;
  if (items.length === 0) return null;
  return (
    <section className={css({ display: "flex", flexDirection: "column", gap: "16px" })}>
      <div className={heading}>
        <h2 className={displayHeading.serif}>Premières fois</h2>
        <span className={aside}>
          {formatCount(discoveries.artists.total)} artistes, {formatCount(discoveries.tracks.total)}{" "}
          titres découverts
        </span>
      </div>
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "16px",
        })}
      >
        {items.map((d) => (
          <Link
            key={`${d.artistName}/${d.trackName}`}
            to="/u/$userName/artistes/$artist"
            params={{ userName, artist: d.artistName }}
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              textDecoration: "none",
            })}
          >
            <span className={css({ position: "relative", display: "block" })}>
              {d.trackName ? (
                <AlbumCover artist={d.artistName} album={d.releaseName} track={d.trackName} />
              ) : (
                <ArtistCover artist={d.artistName} />
              )}
              <NewTag className={css({ position: "absolute", left: "8px", top: "8px" })} />
            </span>
            <span
              className={css({
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                fontSize: "12px",
              })}
            >
              <span>{d.trackName ?? d.artistName}</span>
              <span className={css({ color: "muted" })}>
                le {formatDayMonth(d.firstListenedAt)} · {formatCount(d.listenCount)} écoutes
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** "Tu les as oubliés": favourite albums not played for six months. */
export function ForgottenList({ userName, forgotten }: { userName: string; forgotten: Forgotten }) {
  if (forgotten.items.length === 0) return null;
  return (
    <section className={css({ display: "flex", flexDirection: "column", gap: "16px" })}>
      <div className={heading}>
        <h2 className={displayHeading.narrow}>Tu les as oubliés</h2>
        <span className={aside}>plus écoutés depuis {forgotten.months} mois</span>
      </div>
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        })}
      >
        {forgotten.items.map((f) => {
          const album = f.releaseName ?? f.artistName;
          return (
            <Link
              key={`${f.artistName}/${album}`}
              to="/u/$userName/albums/$artist/$album"
              params={{ userName, artist: f.artistName, album }}
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
              })}
            >
              <span className={css({ filter: "grayscale(0.6)", flexShrink: 0 })}>
                <AlbumCover artist={f.artistName} album={f.releaseName} size={64} />
              </span>
              <span
                className={css({
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  minWidth: 0,
                })}
              >
                <span
                  className={css({
                    fontSize: "13px",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  })}
                >
                  {album}
                </span>
                <span className={css({ fontSize: "12px", color: "muted" })}>{f.artistName}</span>
                <span className={css({ fontSize: "11px", color: "muted" })}>
                  {formatCount(f.listenCount)} écoutes · dernière en{" "}
                  {formatMonthYear(f.lastListenedAt)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** "Un 20 novembre": what was played on this day in previous years. */
export function OnThisDayList({ onThisDay }: { onThisDay: OnThisDay }) {
  if (onThisDay.years.length === 0) return null;
  return (
    <section className={css({ display: "flex", flexDirection: "column", gap: "20px" })}>
      <h2 className={displayHeading.wide}>
        Un {formatDayString(onThisDay.date).replace(/\.$/, "")}
      </h2>
      <div className={css({ display: "flex", flexDirection: "column" })}>
        {onThisDay.years.map((y) => (
          <div
            key={y.year}
            className={css({
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: "8px 24px",
              py: "16px",
              borderTop: "1px solid token(colors.rule)",
            })}
          >
            <span
              className={css({
                width: "120px",
                textStyle: "narrow",
                fontSize: "44px",
                lineHeight: 1,
              })}
            >
              {y.year}
            </span>
            <span className={css({ width: "120px", fontSize: "12px", color: "muted" })}>
              il y a {y.yearsAgo} an{y.yearsAgo > 1 ? "s" : ""}
              <br />
              {formatCount(y.listenCount)} écoutes
            </span>
            <span className={css({ flex: "1 1 280px", fontSize: "13px", lineHeight: "20px" })}>
              {y.tracks
                .map((t) => `${t.trackName ?? t.releaseName ?? ""}, ${t.artistName}`)
                .join(" · ")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The yellow call to the year in review. */
export function WrappedCta({ userName, year }: { userName: string; year: number }) {
  return (
    <Link
      to="/u/$userName/bilan"
      params={{ userName }}
      search={{ annee: year }}
      className={css({
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        p: "32px",
        bg: "yellow",
        color: "ink",
        textDecoration: "none",
        _hover: { color: "ink" },
      })}
    >
      <span className={css({ display: "flex", flexDirection: "column", gap: "6px" })}>
        <span className={css({ textStyle: "wide", fontSize: "32px", lineHeight: 1 })}>
          Ton année {year}
        </span>
        <span className={css({ fontSize: "13px" })}>
          Tops, découvertes, plus longue série : le bilan complet.
        </span>
      </span>
      <span
        className={css({
          height: "36px",
          px: "16px",
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "button",
          bg: "ink",
          color: "page",
          fontSize: "13px",
          fontWeight: "500",
        })}
      >
        Voir le bilan
      </span>
    </Link>
  );
}
