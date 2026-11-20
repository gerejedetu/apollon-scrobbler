import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";
import type { TrackPage as Track } from "../../api/index.ts";
import {
  formatAgo,
  formatCount,
  formatNumericDate,
  formatPeriodMonth,
} from "../../lib/format/index.ts";
import { Breadcrumbs, Main } from "../../ui/layout/index.ts";
import { BigFigure, EntityTitle, fillMonths, PeriodBars, recordOf } from "./shared.tsx";
import { AlbumCover } from "../listens/index.ts";

/** A track: totals and how it was played month by month. `album` comes from where the visitor clicked. */
export function TrackPage({
  userName,
  track,
  album,
  mbid,
}: {
  userName: string;
  track: Track;
  album?: string;
  /** Release MBID of that album, when known. */
  mbid?: string;
}) {
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
            kind="TITRE"
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
        </div>
      </section>
      <section
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "24px",
        })}
      >
        <BigFigure label="ÉCOUTES" value={formatCount(track.listenCount)} />
        {track.firstListenedAt ? (
          <BigFigure label="1RE ÉCOUTE" value={formatNumericDate(track.firstListenedAt)} />
        ) : null}
        {track.lastListenedAt ? (
          <BigFigure
            label="DERNIÈRE"
            value={formatAgo(track.lastListenedAt).replace(/^il y a /, "")}
          />
        ) : null}
      </section>
      {months.length > 0 ? (
        <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
          <h2 className={css({ m: 0, textStyle: "serif", fontSize: "32px", lineHeight: 1 })}>
            Mois par mois
          </h2>
          <PeriodBars periods={months} height={160} label={`Écoutes de ${track.track} par mois`} />
          {record ? (
            <span className={css({ fontSize: "12px", color: "muted" })}>
              Mois record :{" "}
              <b className={css({ color: "ink", fontWeight: "600" })}>
                {formatPeriodMonth(record.period)}, {formatCount(record.listenCount)} écoutes
              </b>
            </span>
          ) : null}
        </section>
      ) : null}
    </Main>
  );
}
