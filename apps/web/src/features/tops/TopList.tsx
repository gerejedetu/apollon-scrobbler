import { Link, useNavigate } from "@tanstack/react-router";
import { css } from "styled-system/css";
import type { Range, Top, TopItem } from "../../api/index.ts";
import { barWidth, formatCount } from "../../lib/format/index.ts";
import { RANGE_OPTIONS } from "../../lib/ranges.ts";
import { SelectMenu } from "../../ui/zag/index.ts";
import { Button, Empty } from "../../ui/primitives/index.ts";
import type { Kind } from "./kinds.ts";
import { AlbumCover, ArtistCover } from "../../ui/cover/index.ts";

const row = css({
  display: "flex",
  alignItems: "center",
  gap: "14px",
  py: "10px",
  borderTop: "1px solid token(colors.ruleSoft)",
  textDecoration: "none",
});

function ItemLink({ userName, kind, item }: { userName: string; kind: Kind; item: TopItem }) {
  if (kind === "albums" && item.album)
    return {
      to: "/u/$userName/albums/$artist/$album",
      params: { userName, artist: item.artist, album: item.album },
      search: { mbid: item.mbids?.release ?? undefined },
    } as const;
  if (kind === "titres" && item.track)
    return {
      to: "/u/$userName/titres/$artist/$track",
      params: { userName, artist: item.artist, track: item.track },
      search: { album: item.album ?? undefined, mbid: item.mbids?.release ?? undefined },
    } as const;
  return {
    to: "/u/$userName/artistes/$artist",
    params: { userName, artist: item.artist },
  } as const;
}

/** A ranked list with bars, the period pills, and "Afficher plus" (offset paging). */
export function TopList({
  userName,
  kind,
  top,
  range,
  onMore,
  loadingMore,
}: {
  userName: string;
  kind: Kind;
  top: Top;
  range: Range;
  onMore?: () => void;
  loadingMore?: boolean;
}) {
  const max = top.items[0]?.listenCount ?? 0;
  return (
    <section className={css({ display: "flex", flexDirection: "column", gap: "16px" })}>
      <div className={css({ display: "flex", justifyContent: "flex-end" })}>
        <SelectMenu<Range>
          label="Période"
          value={range}
          options={RANGE_OPTIONS}
          onValueChange={(periode) =>
            void navigate({
              to: "/u/$userName/tops/$kind",
              params: { userName, kind },
              search: { periode },
              resetScroll: false,
            })
          }
        />
      </div>
      {top.items.length === 0 ? (
        <Empty>Aucune écoute sur cette période.</Empty>
      ) : (
        <div>
          {top.items.map((item, i) => (
            <Link
              key={`${item.artist}/${item.album}/${item.track}`}
              {...ItemLink({ userName, kind, item })}
              className={row}
            >
              <span
                className={css({
                  width: "28px",
                  textAlign: "right",
                  fontSize: "12px",
                  color: "muted",
                })}
              >
                {i + 1}
              </span>
              {kind === "artistes" ? (
                <ArtistCover artist={item.artist} size={36} />
              ) : (
                <AlbumCover
                  artist={item.artist}
                  album={item.album}
                  track={item.track}
                  mbid={item.mbids?.release}
                  size={36}
                />
              )}
              <span
                className={css({
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                })}
              >
                <span className={css({ fontSize: "13px", fontWeight: "500" })}>
                  {kind === "artistes" ? item.artist : kind === "albums" ? item.album : item.track}
                </span>
                {kind !== "artistes" ? (
                  <span className={css({ fontSize: "12px", color: "muted" })}>
                    {item.artist}
                    {kind === "titres" && item.album ? (
                      <>
                        {" · "}
                        <i>{item.album}</i>
                      </>
                    ) : null}
                  </span>
                ) : null}
              </span>
              <span
                className={css({ width: "120px", height: "6px", bg: "ruleSoft", hideBelow: "sm" })}
              >
                <span
                  className={css({ display: "block", height: "6px", bg: "ink" })}
                  style={{ width: barWidth(item.listenCount, max) }}
                />
              </span>
              <span
                className={css({
                  width: "56px",
                  textAlign: "right",
                  fontSize: "12px",
                  color: "muted",
                })}
              >
                {formatCount(item.listenCount)}
              </span>
            </Link>
          ))}
        </div>
      )}
      {onMore && top.items.length < top.total ? (
        <Button
          tone="outline"
          size="sm"
          onClick={onMore}
          disabled={loadingMore}
          className={css({ alignSelf: "center" })}
        >
          {loadingMore ? "Chargement…" : "Afficher plus"}
        </Button>
      ) : null}
    </section>
  );
}
