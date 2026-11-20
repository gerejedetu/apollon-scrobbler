import { css } from "styled-system/css";
import type { Listen, Track } from "../../api/index.ts";
import { formatListenedAt } from "../../lib/format/index.ts";
import { Cover } from "../../ui/cover/index.ts";
import { albumSeed } from "./seeds.ts";

const row = css({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  py: "10px",
  borderTop: "1px solid token(colors.ruleSoft)",
});
const ellipsis = css({ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });

/** One listen: thumbnail, title, "artist · album", and when (violet while playing). */
export function ListenRow({
  track,
  when,
  playing,
}: {
  track: Track;
  when: string;
  playing?: boolean;
}) {
  return (
    <div className={row}>
      <div className={css({ width: "40px", flexShrink: 0 })}>
        <Cover seed={albumSeed(track.artist, track.album)} mbid={track.mbids?.release} size={40} />
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
        <span className={`${ellipsis} ${css({ fontSize: "13px", fontWeight: "500" })}`}>
          {track.track}
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
    </div>
  );
}

export function ListenItem({ listen, now }: { listen: Listen; now?: number }) {
  return <ListenRow track={listen} when={formatListenedAt(listen.listenedAt, now)} />;
}
