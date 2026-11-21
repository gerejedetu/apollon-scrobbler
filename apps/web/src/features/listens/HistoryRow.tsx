import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";
import type { Listen, Track } from "../../api/index.ts";
import { formatTime } from "../../lib/format/index.ts";
import { AlbumCover } from "../../ui/cover/index.ts";
import { ListenActions, LovedMark, useFavourites } from "../favourites/index.ts";
import { formatTrackLength, listenSource } from "./source.ts";
import { m } from "../../paraglide/messages.js";

const row = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  py: "10px",
  borderBottom: "1px solid token(colors.ruleSoft)",
});
const ellipsis = css({ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });

/** One line of the history: time, sleeve, title and artist (links), source chip, length, actions. */
function Row({
  userName,
  track,
  time,
  playing,
  actions,
}: {
  userName: string;
  track: Track;
  time: string;
  playing?: boolean;
  actions?: React.ReactNode;
}) {
  const source = listenSource(track);
  return (
    <div className={row} style={playing ? { background: "var(--colors-violet-soft)" } : undefined}>
      <span
        className={css({ width: "44px", flexShrink: 0, fontSize: "12px" })}
        style={
          playing
            ? { color: "var(--colors-violet)", fontWeight: 600 }
            : { color: "var(--colors-muted)" }
        }
      >
        {time}
      </span>
      <AlbumCover
        artist={track.artist}
        album={track.album}
        track={track.track}
        mbid={track.mbids?.release}
        size={40}
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
        <span className={css({ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 })}>
          <Link
            to="/u/$userName/titres/$artist/$track"
            params={{ userName, artist: track.artist, track: track.track }}
            search={{ album: track.album ?? undefined, mbid: track.mbids?.release ?? undefined }}
            className={`${ellipsis} ${css({ fontSize: "13px", fontWeight: "500", textDecoration: "none" })}`}
          >
            {track.track}
          </Link>
          <LovedMark track={track} />
        </span>
        <span className={`${ellipsis} ${css({ fontSize: "12px", color: "muted" })}`}>
          <Link
            to="/u/$userName/artistes/$artist"
            params={{ userName, artist: track.artist }}
            className={css({ color: "muted", textDecoration: "none" })}
          >
            {track.artist}
          </Link>
          {track.album ? (
            <>
              {" · "}
              <i>{track.album}</i>
            </>
          ) : null}
        </span>
      </span>
      {source ? (
        <span
          className={css({
            display: { base: "none", sm: "inline-flex" },
            height: "22px",
            px: "8px",
            alignItems: "center",
            borderRadius: "11px",
            bg: "field",
            fontSize: "11px",
            color: "muted",
            whiteSpace: "nowrap",
          })}
        >
          {source}
        </span>
      ) : null}
      <span
        className={css({ width: "40px", textAlign: "right", fontSize: "12px", color: "muted" })}
      >
        {formatTrackLength(track.durationMs)}
      </span>
      {actions ?? <span className={css({ width: "28px", flexShrink: 0 })} />}
    </div>
  );
}

export function HistoryListen({ userName, listen }: { userName: string; listen: Listen }) {
  const fav = useFavourites();
  if (fav.isDeleted(listen)) return null;
  return (
    <Row
      userName={userName}
      track={listen}
      time={formatTime(listen.listenedAt)}
      actions={<ListenActions listen={listen} onDelete={() => void fav.deleteListen(listen)} />}
    />
  );
}

export function HistoryNowPlaying({ userName, track }: { userName: string; track: Track }) {
  return <Row userName={userName} track={track} time={m.playing()} playing />;
}
