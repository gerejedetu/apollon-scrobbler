import type { ReactNode } from "react";
import { css } from "styled-system/css";
import type { Listen, Track } from "../../api/index.ts";
import { formatListenedAt } from "../../lib/format/index.ts";
import { ListenActions, LovedMark, useFavourites } from "../favourites/index.ts";
import { AlbumCover } from "../../ui/cover/index.ts";

const row = css({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  py: "10px",
  borderTop: "1px solid token(colors.ruleSoft)",
});
const ellipsis = css({ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });

/** One listen: thumbnail, title, "artist · album", when (violet while playing), and its actions. */
export function ListenRow({
  track,
  when,
  playing,
  actions,
}: {
  track: Track;
  when: string;
  playing?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className={row}>
      <div className={css({ width: "40px", flexShrink: 0 })}>
        <AlbumCover
          artist={track.artist}
          album={track.album}
          track={track.track}
          mbid={track.mbids?.release}
          size={40}
        />
      </div>
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
          <span className={`${ellipsis} ${css({ fontSize: "13px", fontWeight: "500" })}`}>
            {track.track}
          </span>
          <LovedMark track={track} />
        </span>
        <span className={`${ellipsis} ${css({ fontSize: "12px", color: "muted" })}`}>
          {track.artist}
          {track.album ? (
            <>
              {" · "}
              <i>{track.album}</i>
            </>
          ) : null}
        </span>
      </div>
      <span
        className={css({ fontSize: "12px", whiteSpace: "nowrap" })}
        style={{ color: playing ? "#6E44FF" : "#6F6F6F" }}
      >
        {when}
      </span>
      {actions}
    </div>
  );
}

/** A stored listen; its owner can act on it from the "⋯" menu (deleting is immediate). */
export function ListenItem({ listen, now }: { listen: Listen; now?: number }) {
  const fav = useFavourites();
  if (fav.isDeleted(listen)) return null;
  return (
    <ListenRow
      track={listen}
      when={formatListenedAt(listen.listenedAt, now)}
      actions={<ListenActions listen={listen} onDelete={() => void fav.deleteListen(listen)} />}
    />
  );
}
