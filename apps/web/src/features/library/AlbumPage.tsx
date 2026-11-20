import { Link } from "@tanstack/react-router";
import { css } from "styled-system/css";
import type { AlbumPage as Album } from "../../api/index.ts";
import { barWidth, formatAgo, formatCount, formatDate } from "../../lib/format/index.ts";
import { Breadcrumbs, Main } from "../../ui/layout/index.ts";
import { capsLabel, Stat } from "../../ui/primitives/index.ts";
import { EntityTitle } from "./shared.tsx";
import { AlbumCover } from "../../ui/cover/index.ts";

/** An album: the sleeve with totals, first and last listen, and its tracks by plays. */
export function AlbumPage({
  userName,
  album,
  mbid,
}: {
  userName: string;
  album: Album;
  /** Release MBID from the link that led here, for the real sleeve. */
  mbid?: string;
}) {
  const max = Math.max(0, ...album.tracks.map((t) => t.listenCount));
  const artistLink = {
    to: "/u/$userName/artistes/$artist",
    params: { userName, artist: album.artist },
  } as const;
  return (
    <Main gap={32}>
      <Breadcrumbs
        items={[
          <Link key="p" to="/u/$userName" params={{ userName }}>
            Accueil
          </Link>,
          <Link key="a" {...artistLink}>
            {album.artist}
          </Link>,
          album.album,
        ]}
      />
      <div
        className={css({
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          alignItems: "flex-start",
        })}
      >
        <div
          className={css({
            flex: "0 1 240px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          })}
        >
          <AlbumCover artist={album.artist} album={album.album} title={album.album} mbid={mbid} />
          <div className={css({ display: "flex", justifyContent: "space-around" })}>
            <Stat align="center" value={formatCount(album.listenCount)} label="ÉCOUTES" />
            <Stat align="center" value={formatCount(album.tracks.length)} label="TITRES" />
          </div>
        </div>
        <div
          className={css({
            flex: "1 1 420px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          })}
        >
          <EntityTitle
            kind="ALBUM"
            title={album.album}
            sub={
              <Link
                {...artistLink}
                className={css({ fontSize: "18px", color: "muted", textDecoration: "none" })}
              >
                {album.artist}
              </Link>
            }
          />
          {album.firstListenedAt && album.lastListenedAt ? (
            <span className={css({ fontSize: "13px", color: "muted" })}>
              1re écoute le{" "}
              <b className={css({ color: "ink", fontWeight: "500" })}>
                {formatDate(album.firstListenedAt)}
              </b>{" "}
              · dernière{" "}
              <b className={css({ color: "ink", fontWeight: "500" })}>
                {formatAgo(album.lastListenedAt)}
              </b>
            </span>
          ) : null}
          <section className={css({ display: "flex", flexDirection: "column" })}>
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "14px",
                pb: "8px",
                borderBottom: "1px solid token(colors.rule)",
              })}
            >
              <span className={capsLabel} style={{ width: 20, textAlign: "right" }}>
                #
              </span>
              <span className={capsLabel} style={{ flex: 1 }}>
                TITRE
              </span>
              <span className={capsLabel} style={{ width: 140 }}>
                ÉCOUTES
              </span>
              <span className={capsLabel} style={{ width: 90, textAlign: "right" }}>
                DERNIÈRE
              </span>
            </div>
            {album.tracks.map((t, i) => (
              <Link
                key={t.trackName}
                to="/u/$userName/titres/$artist/$track"
                params={{ userName, artist: album.artist, track: t.trackName }}
                search={{ album: album.album, mbid }}
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  py: "11px",
                  borderBottom: "1px solid token(colors.ruleSoft)",
                  textDecoration: "none",
                })}
              >
                <span
                  className={css({
                    width: "20px",
                    textAlign: "right",
                    fontSize: "12px",
                    color: "muted",
                  })}
                >
                  {i + 1}
                </span>
                <span
                  className={css({
                    flex: 1,
                    minWidth: 0,
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  })}
                >
                  {t.trackName}
                </span>
                <span
                  className={css({
                    width: "140px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  })}
                >
                  <span className={css({ flex: 1, height: "6px", bg: "ruleSoft" })}>
                    <span
                      className={css({ display: "block", height: "6px", bg: "yellow" })}
                      style={{ width: barWidth(t.listenCount, max) }}
                    />
                  </span>
                  <span
                    className={css({
                      width: "28px",
                      textAlign: "right",
                      fontSize: "12px",
                      color: "muted",
                    })}
                  >
                    {formatCount(t.listenCount)}
                  </span>
                </span>
                <span
                  className={css({
                    width: "90px",
                    textAlign: "right",
                    fontSize: "12px",
                    color: "muted",
                  })}
                >
                  {formatAgo(t.lastListenedAt)}
                </span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </Main>
  );
}
