import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { AlbumCover } from "../../ui/cover/index.ts";
import { m } from "../../paraglide/messages.js";

export const coverGrid = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
  gap: "14px",
});
const card = css({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: 0,
  textDecoration: "none",
});
const lines = css({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  fontSize: "12px",
  minWidth: 0,
});
export const ellipsis = css({ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });

/** A sleeve with its rank, title and "artist · n écoutes", linking to the album page. */
export function AlbumCard({
  userName,
  rank,
  artist,
  album,
  plays,
  badge,
  title,
  mbid,
}: {
  userName: string;
  rank?: number;
  artist: string;
  album: string;
  plays: number;
  badge?: ReactNode;
  /** Text under the cover (defaults to the album). */
  title?: string;
  /** Release MBID, for the real sleeve here and on the album page. */
  mbid?: string | null;
}) {
  return (
    <Link
      to="/u/$userName/albums/$artist/$album"
      params={{ userName, artist, album }}
      search={{ mbid: mbid ?? undefined }}
      className={card}
    >
      <AlbumCover artist={artist} album={album} title={album} mbid={mbid} />
      <span className={lines}>
        {rank !== undefined ? <span className={css({ color: "muted" })}>{rank}.</span> : null}
        <span className={css({ display: "flex", gap: "6px", alignItems: "center", minWidth: 0 })}>
          <span className={ellipsis}>{title ?? album}</span>
          {badge}
        </span>
        <span className={`${ellipsis} ${css({ color: "muted" })}`}>
          {artist} · {m.count_listens({ count: plays })}
        </span>
      </span>
    </Link>
  );
}
