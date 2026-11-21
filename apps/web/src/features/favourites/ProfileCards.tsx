import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";
import type { Favourite } from "../../api/index.ts";
import { formatDayMonth } from "../../lib/format/index.ts";
import { FlameIcon, HeartIcon } from "../../ui/icons.tsx";
import { CountBadge } from "../../ui/primitives/index.ts";
import { AlbumCover } from "../../ui/cover/index.ts";
import { useFavourites } from "./context.tsx";
import { m } from "../../paraglide/messages.js";

const stack = css({ display: "flex", flexDirection: "column", gap: "12px" });
const heading = css({
  m: 0,
  display: "flex",
  alignItems: "center",
  gap: "8px",
  textStyle: "block",
});

/** "Obsession du moment": the one track the user pinned, styled like "En écoute". */
export function ObsessionCard({ userName }: { userName: string }) {
  const { obsession } = useFavourites();
  if (!obsession) return null;
  return (
    <section className={stack}>
      <h2 className={heading}>
        <span className={css({ color: "violet", display: "inline-flex" })}>
          <FlameIcon />
        </span>
        {m.obsession_title()}
      </h2>
      <Link
        to="/u/$userName/titres/$artist/$track"
        params={{ userName, artist: obsession.artist, track: obsession.track }}
        search={{ album: obsession.album ?? undefined, mbid: obsession.mbids.release ?? undefined }}
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "12px",
          p: "10px",
          bg: "panel",
          borderRadius: "field",
          textDecoration: "none",
        })}
      >
        <AlbumCover
          artist={obsession.artist}
          album={obsession.album}
          track={obsession.track}
          mbid={obsession.mbids.release}
          size={48}
        />
        <span
          className={css({
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          })}
        >
          <span className={css({ fontSize: "13px", fontWeight: "500" })}>{obsession.track}</span>
          <span className={css({ fontSize: "12px", color: "muted" })}>
            {[obsession.artist, obsession.album].filter(Boolean).join(" · ")}
          </span>
          {obsession.since ? (
            <span className={css({ fontSize: "11px", color: "muted" })}>
              {m.since_date({ date: formatDayMonth(obsession.since) })}
            </span>
          ) : null}
        </span>
      </Link>
    </section>
  );
}

/** "Coups de cœur": the latest loved tracks. */
export function LovedCard({
  userName,
  loved,
  total,
}: {
  userName: string;
  loved: Favourite[];
  total: number;
}) {
  const fav = useFavourites();
  const shown = loved.filter((f) => fav.isLoved(f)).slice(0, 5);
  if (shown.length === 0) return null;
  return (
    <section className={stack}>
      <h2 className={heading}>
        {m.loved_title()} <CountBadge>{total}</CountBadge>
      </h2>
      {shown.map((f) => (
        <Link
          key={`${f.artist}/${f.track}`}
          to="/u/$userName/titres/$artist/$track"
          params={{ userName, artist: f.artist, track: f.track }}
          search={{ album: f.album ?? undefined, mbid: f.mbids.release ?? undefined }}
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          })}
        >
          <AlbumCover
            artist={f.artist}
            album={f.album}
            track={f.track}
            mbid={f.mbids.release}
            size={32}
          />
          <span
            className={css({
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              fontSize: "12px",
            })}
          >
            <span
              className={css({
                fontWeight: "500",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              })}
            >
              {f.track}
            </span>
            <span className={css({ color: "muted" })}>{f.artist}</span>
          </span>
          <span className={css({ color: "violet", display: "inline-flex" })}>
            <HeartIcon size={12} filled />
          </span>
        </Link>
      ))}
    </section>
  );
}
