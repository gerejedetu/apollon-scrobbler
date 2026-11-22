import { Link } from "@tanstack/react-router";
import { splitArtistCredit } from "@scrobbler/core";
import { Fragment } from "react";
import { css } from "styled-system/css";
import type { Track } from "../../api/index.ts";
import { AlbumCover, youtubeId } from "../../ui/cover/index.ts";

const ellipsis = css({ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });
const link = css({
  color: "inherit",
  textDecoration: "none",
  borderRadius: "2px",
  _hover: { color: "violet" },
});

/**
 * "Sickboyrari & Krisu" → ["Sickboyrari", " & ", "Krisu"]: each credited artist (as the stats count them)
 * with the separators between them kept as written.
 */
export function creditParts(credit: string): { text: string; artist?: string }[] {
  const artists = splitArtistCredit(credit);
  if (artists.length < 2) return [{ text: credit, artist: credit }];
  const parts: { text: string; artist?: string }[] = [];
  let rest = credit;
  for (const artist of artists) {
    const at = rest.toLowerCase().indexOf(artist.toLowerCase());
    if (at < 0) return [{ text: credit, artist: credit }];
    if (at > 0) parts.push({ text: rest.slice(0, at) });
    parts.push({ text: rest.slice(at, at + artist.length), artist });
    rest = rest.slice(at + artist.length);
  }
  if (rest) parts.push({ text: rest });
  return parts;
}

function albumTarget(userName: string, track: Track) {
  return track.album
    ? ({
        to: "/u/$userName/albums/$artist/$album",
        params: { userName, artist: track.artist, album: track.album },
        search: { mbid: track.mbids?.release ?? undefined },
      } as const)
    : null;
}

/** The sleeve of a listen, linking to its album (or to the track when the album is unknown). */
export function CoverLink({
  userName,
  track,
  size,
}: {
  userName: string;
  track: Track;
  size: number;
}) {
  const album = albumTarget(userName, track);
  const cover = (
    <AlbumCover
      artist={track.artist}
      album={track.album}
      track={track.track}
      mbid={track.mbids?.release}
      youtube={youtubeId(track.extra?.origin_url)}
      size={size}
    />
  );
  const className = css({
    display: "block",
    flexShrink: 0,
    borderRadius: "2px",
    _hover: { opacity: 0.85 },
  });
  return album ? (
    <Link {...album} tabIndex={-1} aria-hidden="true" className={className}>
      {cover}
    </Link>
  ) : (
    <TitleLink userName={userName} track={track} tabIndex={-1} className={className}>
      {cover}
    </TitleLink>
  );
}

/** The title, linking to the track page. */
export function TitleLink({
  userName,
  track,
  className,
  tabIndex,
  children,
}: {
  userName: string;
  track: Track;
  className?: string;
  tabIndex?: number;
  children?: React.ReactNode;
}) {
  return (
    <Link
      to="/u/$userName/titres/$artist/$track"
      params={{ userName, artist: track.artist, track: track.track }}
      search={{ album: track.album ?? undefined, mbid: track.mbids?.release ?? undefined }}
      tabIndex={tabIndex}
      aria-hidden={tabIndex === -1 ? "true" : undefined}
      className={className ?? `${ellipsis} ${link}`}
    >
      {children ?? track.track}
    </Link>
  );
}

/** "Artist · Album": every credited artist links to its page, the album to its own. */
export function CreditLine({ userName, track }: { userName: string; track: Track }) {
  const album = albumTarget(userName, track);
  return (
    <span className={`${ellipsis} ${css({ fontSize: "12px", color: "muted" })}`}>
      {creditParts(track.artist).map((p, i) =>
        p.artist ? (
          <Link
            key={i}
            to="/u/$userName/artistes/$artist"
            params={{ userName, artist: p.artist }}
            className={link}
          >
            {p.text}
          </Link>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
      {album ? (
        <>
          {" · "}
          <Link {...album} className={link}>
            <i>{track.album}</i>
          </Link>
        </>
      ) : null}
    </span>
  );
}
