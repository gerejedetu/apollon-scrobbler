import { css } from "styled-system/css";
import type { Listen, Track } from "../../api/index.ts";
import { formatTime } from "../../lib/format/index.ts";
import { Equalizer } from "../../ui/feedback/index.ts";
import { CoverLink, CreditLine, TitleLink } from "./TrackLinks.tsx";
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
  time?: string;
  playing?: boolean;
  actions?: React.ReactNode;
}) {
  const source = listenSource(track);
  return (
    <div className={row} style={playing ? { background: "var(--colors-violet-soft)" } : undefined}>
      <span
        className={css({
          width: "44px",
          flexShrink: 0,
          display: "flex",
          fontSize: "12px",
          color: "muted",
        })}
        style={playing ? { justifyContent: "center" } : undefined}
      >
        {playing ? <Equalizer label={m.playing()} /> : time}
      </span>
      <CoverLink userName={userName} track={track} size={40} />
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
          <span
            className={css({ fontSize: "13px", fontWeight: "500", minWidth: 0, display: "flex" })}
          >
            <TitleLink userName={userName} track={track} />
          </span>
          <LovedMark track={track} />
        </span>
        <CreditLine userName={userName} track={track} />
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
      {/* Same slot on every row, menu or not (visitors, now playing): badges and lengths line up. */}
      <span className={css({ width: "28px", flexShrink: 0, display: "flex" })}>{actions}</span>
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
  return <Row userName={userName} track={track} playing />;
}
