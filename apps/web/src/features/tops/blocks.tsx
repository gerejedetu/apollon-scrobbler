/** Ranked blocks shared by Stats and the year in review: artists and albums in 5 columns, tracks in rows. */
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { barWidth, formatCount } from "../../lib/format/index.ts";
import { AlbumCover, ArtistCover } from "../../ui/cover/index.ts";
import { ChevronRight } from "../../ui/icons.tsx";
import { m } from "../../paraglide/messages.js";
import { sectionTitle } from "../../ui/primitives/index.ts";

const grid5 = css({
  display: "grid",
  gridTemplateColumns: { base: "repeat(3, minmax(0, 1fr))", sm: "repeat(5, minmax(0, 1fr))" },
  gap: "14px",
});
const card = css({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  textDecoration: "none",
  minWidth: 0,
});
const lines = css({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  fontSize: "12px",
  minWidth: 0,
});
const name = css({
  fontSize: "13px",
  fontWeight: "500",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});
const muted = css({
  color: "muted",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

/** "Top artistes" + "Les 186 artistes ›" style heading. */
export function BlockTitle({ title, more }: { title: string; more?: ReactNode }) {
  return (
    <div
      className={css({
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "12px",
      })}
    >
      <h2 className={sectionTitle}>{title}</h2>
      {more}
    </div>
  );
}

export const moreLink = css({
  fontSize: "13px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: "2px",
});

export function MoreArrow() {
  return <ChevronRight size={14} />;
}

export function ArtistGrid({
  userName,
  items,
}: {
  userName: string;
  items: { artist: string; listenCount: number }[];
}) {
  return (
    <div className={grid5}>
      {items.map((a, i) => (
        <Link
          key={a.artist}
          to="/u/$userName/artistes/$artist"
          params={{ userName, artist: a.artist }}
          className={card}
        >
          <ArtistCover artist={a.artist} />
          <span className={lines}>
            <span className={css({ color: "muted" })}>{i + 1}.</span>
            <span className={name}>{a.artist}</span>
            <span className={css({ color: "muted" })}>
              {m.count_listens({ count: formatCount(a.listenCount) })}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function AlbumGrid({
  userName,
  items,
}: {
  userName: string;
  items: { artist: string; album: string; listenCount: number; mbid?: string | null }[];
}) {
  return (
    <div className={grid5}>
      {items.map((a) => (
        <Link
          key={`${a.artist}/${a.album}`}
          to="/u/$userName/albums/$artist/$album"
          params={{ userName, artist: a.artist, album: a.album }}
          search={{ mbid: a.mbid ?? undefined }}
          className={card}
        >
          <AlbumCover artist={a.artist} album={a.album} mbid={a.mbid} />
          <span className={lines}>
            <span className={name}>{a.album}</span>
            <span className={muted}>
              {a.artist} · {formatCount(a.listenCount)}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function TrackRanking({
  userName,
  items,
  subtitle = "artist",
}: {
  userName: string;
  /** What goes under the title: the artist (tops), or the album in italics (an artist's page). */
  subtitle?: "artist" | "album";
  items: {
    artist: string;
    track: string;
    album?: string | null;
    listenCount: number;
    mbid?: string | null;
  }[];
}) {
  const max = items[0]?.listenCount ?? 0;
  return (
    <div className={css({ display: "flex", flexDirection: "column" })}>
      {items.map((t, i) => (
        <Link
          key={`${t.artist}/${t.track}`}
          to="/u/$userName/titres/$artist/$track"
          params={{ userName, artist: t.artist, track: t.track }}
          search={{ album: t.album ?? undefined, mbid: t.mbid ?? undefined }}
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "14px",
            py: "10px",
            borderTop: "1px solid token(colors.ruleSoft)",
            textDecoration: "none",
          })}
        >
          <span
            className={css({ width: "20px", textAlign: "right", fontSize: "12px", color: "muted" })}
          >
            {i + 1}
          </span>
          <AlbumCover artist={t.artist} album={t.album} track={t.track} mbid={t.mbid} size={36} />
          <span
            className={css({
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            })}
          >
            <span className={name}>{t.track}</span>
            <span className={css({ fontSize: "12px", color: "muted" })}>
              {subtitle === "album" ? t.album ? <i>{t.album}</i> : null : t.artist}
            </span>
          </span>
          <span
            className={css({
              display: { base: "none", sm: "block" },
              width: "120px",
              height: "6px",
              bg: "ruleSoft",
            })}
          >
            <span
              className={css({ display: "block", height: "6px", bg: "ink" })}
              style={{ width: barWidth(t.listenCount, max) }}
            />
          </span>
          <span
            className={css({ width: "40px", textAlign: "right", fontSize: "12px", color: "muted" })}
          >
            {formatCount(t.listenCount)}
          </span>
        </Link>
      ))}
    </div>
  );
}
