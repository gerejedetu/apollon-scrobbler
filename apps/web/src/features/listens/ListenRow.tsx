import type { ReactNode } from "react";
import { css } from "styled-system/css";
import type { Listen, Track } from "../../api/index.ts";
import { formatListenedAt } from "../../lib/format/index.ts";
import { ListenActions, LovedMark, useFavourites } from "../favourites/index.ts";
import { CoverLink, CreditLine, TitleLink } from "./TrackLinks.tsx";
import { Equalizer } from "../../ui/feedback/index.ts";
import { m } from "../../paraglide/messages.js";

const row = css({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  py: "10px",
  borderTop: "1px solid token(colors.ruleSoft)",
});

/** One listen: thumbnail, title, "artist · album", when (violet while playing), and its actions. */
export function ListenRow({
  userName,
  track,
  when,
  playing,
  actions,
}: {
  userName: string;
  track: Track;
  when?: string;
  playing?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className={row}>
      <CoverLink userName={userName} track={track} size={40} />
      <div
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
      </div>
      {playing ? (
        <Equalizer label={m.playing()} />
      ) : (
        <span className={css({ fontSize: "12px", whiteSpace: "nowrap", color: "muted" })}>
          {when}
        </span>
      )}
      <span className={css({ width: "28px", flexShrink: 0, display: "flex" })}>{actions}</span>
    </div>
  );
}

/** A stored listen; its owner can act on it from the "⋯" menu (deleting is immediate). */
export function ListenItem({
  userName,
  listen,
  now,
}: {
  userName: string;
  listen: Listen;
  now?: number;
}) {
  const fav = useFavourites();
  if (fav.isDeleted(listen)) return null;
  return (
    <ListenRow
      userName={userName}
      track={listen}
      when={formatListenedAt(listen.listenedAt, now)}
      actions={<ListenActions listen={listen} onDelete={() => void fav.deleteListen(listen)} />}
    />
  );
}
