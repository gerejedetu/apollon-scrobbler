import { Link, useNavigate } from "@tanstack/react-router";
import { css } from "styled-system/css";
import type { Range, TrackPage as Track } from "../../api/index.ts";
import { rangeOptions } from "../../lib/ranges.ts";
import { SelectMenu } from "../../ui/zag/index.ts";
import {
  formatAgo,
  formatCount,
  formatNumericDate,
  formatPeriodMonth,
} from "../../lib/format/index.ts";
import { Breadcrumbs, Main } from "../../ui/layout/index.ts";
import { BigFigure, EntityTitle, fillMonths, PeriodBars, recordOf } from "./shared.tsx";
import { AlbumCover } from "../../ui/cover/index.ts";
import { m } from "../../paraglide/messages.js";

/** A track: totals and how it was played month by month. `album` comes from where the visitor clicked. */
export function TrackPage({
  userName,
  track,
  album,
  mbid,
  range,
}: {
  userName: string;
  track: Track;
  album?: string;
  /** Release MBID of that album, when known. */
  mbid?: string;
  range: Range;
}) {
  const navigate = useNavigate();
  const months = fillMonths(track.byMonth);
  const record = recordOf(months);
  const artistLink = {
    to: "/u/$userName/artistes/$artist",
    params: { userName, artist: track.artist },
  } as const;
  const albumLink = album
    ? ({
        to: "/u/$userName/albums/$artist/$album",
        params: { userName, artist: track.artist, album },
        search: { mbid },
      } as const)
    : null;
  const muted = css({ color: "muted", textDecoration: "none" });
  return (
    <Main gap={36}>
      <Breadcrumbs
        items={[
          <Link key="a" {...artistLink}>
            {track.artist}
          </Link>,
          ...(albumLink
            ? [
                <Link key="b" {...albumLink}>
                  {album}
                </Link>,
              ]
            : []),
          track.track,
        ]}
      />
      <section
        className={css({ display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "center" })}
      >
        <AlbumCover
          artist={track.artist}
          album={album}
          track={track.track}
          mbid={mbid}
          size={140}
        />
        <div className={css({ flex: "1 1 320px" })}>
          <EntityTitle
            kind={m.caps_track()}
            title={track.track}
            sub={
              <span className={css({ fontSize: "15px", color: "muted" })}>
                <Link {...artistLink} className={muted}>
                  {track.artist}
                </Link>
                {albumLink ? (
                  <>
                    {" · "}
                    <Link {...albumLink} className={muted}>
                      <i>{album}</i>
                    </Link>
                  </>
                ) : null}
              </span>
            }
          />
          <div className={css({ mt: "10px" })}>
            <SelectMenu<Range>
              label={m.period()}
              value={range}
              options={rangeOptions()}
              onValueChange={(periode) =>
                void navigate({
                  to: "/u/$userName/titres/$artist/$track",
                  params: { userName, artist: track.artist, track: track.track },
                  search: (s) => ({ ...s, periode }),
                  resetScroll: false,
                })
              }
            />
          </div>
        </div>
      </section>
      <section
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "24px",
        })}
      >
        <BigFigure label={m.caps_listens()} value={formatCount(track.listenCount)} />
        {track.firstListenedAt ? (
          <BigFigure
            label={m.caps_first_listen()}
            value={formatNumericDate(track.firstListenedAt)}
          />
        ) : null}
        {track.lastListenedAt ? (
          <BigFigure label={m.caps_last()} value={formatAgo(track.lastListenedAt)} />
        ) : null}
      </section>
      {months.length > 0 ? (
        <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
          <h2 className={css({ m: 0, textStyle: "serif", fontSize: "32px", lineHeight: 1 })}>
            {m.month_by_month()}
          </h2>
          <PeriodBars
            periods={months}
            height={160}
            label={m.track_by_month_aria({ track: track.track })}
          />
          {record ? (
            <span className={css({ fontSize: "12px", color: "muted" })}>
              {m.record_month_label()}{" "}
              <b className={css({ color: "ink", fontWeight: "600" })}>
                {formatPeriodMonth(record.period)},{" "}
                {m.count_listens({ count: formatCount(record.listenCount) })}
              </b>
            </span>
          ) : null}
        </section>
      ) : null}
    </Main>
  );
}
