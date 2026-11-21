import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { css } from "styled-system/css";
import type { ArtistPage as Artist, Range, Summary, Timeline } from "../../api/index.ts";
import {
  formatAgo,
  formatCount,
  formatDate,
  formatPeriodMonth,
  formatShare,
  localDate,
  monthKey,
} from "../../lib/format/index.ts";
import { rangeOptions } from "../../lib/ranges.ts";
import { AlbumCover, ArtistCover } from "../../ui/cover/index.ts";
import { ArrowUpRight } from "../../ui/icons.tsx";
import { Breadcrumbs, Main } from "../../ui/layout/index.ts";
import { BlockHeading, Stat } from "../../ui/primitives/index.ts";
import { SelectMenu, TextTabs } from "../../ui/zag/index.ts";
import { TrackRanking } from "../tops/index.ts";
import { lastMonths, LastPeriods, lastWeeks, lastYears } from "./LastPeriods.tsx";
import { EntityTitle, recordOf } from "./shared.tsx";

type Granularity = Timeline["granularity"];

const CAPTIONS: Record<Granularity, string> = {
  month: "Les 12 derniers mois, même ceux sans écoute. Le mois en cours est en violet.",
  week: "Les 12 dernières semaines, même celles sans écoute. La semaine en cours est en violet.",
  year: "Chaque année depuis ta première écoute. L'année en cours est en violet.",
};

export interface ArtistData {
  artist: Artist;
  timelines: Record<Granularity, Timeline>;
  summary: Summary;
}

/** An artist (board "Écran · Artiste"): totals and period, most played tracks, facts, albums, timeline. */
export function ArtistPage({
  userName,
  range,
  data,
}: {
  userName: string;
  range: Range;
  data: ArtistData;
}) {
  const navigate = useNavigate();
  const { artist, timelines, summary } = data;
  const [granularity, setGranularity] = useState<Granularity>("month");
  const record = recordOf(timelines.month.periods);
  const mbid = artist.mbids?.[0];
  const now = localDate(Date.now() / 1000);
  const bars = {
    month: lastMonths(timelines.month.periods, now),
    week: lastWeeks(timelines.week.periods, now),
    year: lastYears(timelines.year.periods, now),
  };

  return (
    <Main gap={32}>
      <Breadcrumbs
        items={[
          <Link key="p" to="/u/$userName" params={{ userName }}>
            Profil
          </Link>,
          <Link key="a" to="/u/$userName/tops/$kind" params={{ userName, kind: "artistes" }}>
            Artistes
          </Link>,
          artist.artist,
        ]}
      />

      <section
        className={css({
          display: "flex",
          flexWrap: "wrap",
          gap: "32px",
          alignItems: "flex-start",
        })}
      >
        <ArtistCover artist={artist.artist} size={200} />
        <div
          className={css({
            flex: "1 1 360px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          })}
        >
          <EntityTitle kind="ARTISTE" title={artist.artist} size={36} />
          <div className={css({ display: "flex", flexWrap: "wrap", gap: "28px" })}>
            <Stat value={formatCount(artist.listenCount)} label="ÉCOUTES" />
            <Stat value={formatCount(artist.trackCount)} label="TITRES" />
            <Stat value={formatCount(artist.albumCount)} label="ALBUMS" />
            {artist.firstListenedAt ? (
              <Stat value={formatDate(artist.firstListenedAt)} label="1RE ÉCOUTE" />
            ) : null}
            {artist.lastListenedAt ? (
              <Stat value={formatAgo(artist.lastListenedAt)} label="DERNIÈRE" />
            ) : null}
          </div>
          <div className={css({ alignSelf: "flex-start" })}>
            <SelectMenu<Range>
              label="Période"
              value={range}
              options={rangeOptions()}
              onValueChange={(periode) =>
                void navigate({
                  to: "/u/$userName/artistes/$artist",
                  params: { userName, artist: artist.artist },
                  search: { periode },
                  resetScroll: false,
                })
              }
            />
          </div>
        </div>
      </section>

      <div
        className={css({
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          alignItems: "flex-start",
        })}
      >
        <section
          className={css({
            flex: "999 1 520px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          })}
        >
          <BlockHeading
            title="Titres les plus écoutés"
            aside={`${artist.topTracks.length} sur ${formatCount(artist.trackCount)} titres`}
          />
          <TrackRanking
            subtitle="album"
            userName={userName}
            items={artist.topTracks.map((t) => ({
              artist: artist.artist,
              track: t.track,
              album: t.album,
              listenCount: t.listenCount,
            }))}
          />
        </section>
        <aside
          className={css({
            flex: "1 1 240px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            fontSize: "13px",
          })}
        >
          <h2 className={css({ m: 0, textStyle: "block" })}>Infos</h2>
          {record ? (
            <span className={css({ display: "flex", justifyContent: "space-between" })}>
              <span className={css({ color: "muted" })}>Mois record</span>
              <span>
                {formatPeriodMonth(record.period)} · {formatCount(record.listenCount)}
              </span>
            </span>
          ) : null}
          {summary.listenCount > 0 ? (
            <span className={css({ display: "flex", justifyContent: "space-between" })}>
              <span className={css({ color: "muted" })}>Part de tes écoutes</span>
              <span>{formatShare(artist.listenCount / summary.listenCount)}</span>
            </span>
          ) : null}
          {mbid ? (
            <a
              href={`https://musicbrainz.org/artist/${mbid}`}
              target="_blank"
              rel="noreferrer"
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "5px",
                textDecoration: "none",
                color: "violet",
              })}
            >
              Voir sur MusicBrainz
              <ArrowUpRight />
            </a>
          ) : null}
        </aside>
      </div>

      {artist.albums.length > 0 ? (
        <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
          <BlockHeading title="Albums" aside="Du plus écouté au moins écouté" />
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "24px 16px",
            })}
          >
            {artist.albums.map((a) => (
              <Link
                key={a.album}
                to="/u/$userName/albums/$artist/$album"
                params={{ userName, artist: artist.artist, album: a.album }}
                search={{ mbid: a.releaseMbid ?? undefined }}
                className={css({
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  textDecoration: "none",
                  minWidth: 0,
                })}
              >
                <AlbumCover artist={artist.artist} album={a.album} mbid={a.releaseMbid} />
                <span
                  className={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    fontSize: "12px",
                    minWidth: 0,
                  })}
                >
                  <span
                    className={css({
                      fontSize: "13px",
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    })}
                  >
                    {a.album}
                  </span>
                  <span>
                    {formatCount(a.listenCount)} écoutes · {a.trackCount} titres
                  </span>
                  <span className={css({ color: "muted" })}>
                    de {formatPeriodMonth(monthKey(a.firstListenedAt))} à{" "}
                    {formatPeriodMonth(monthKey(a.lastListenedAt))}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
        <TextTabs<Granularity>
          label="Échelle"
          value={granularity}
          onValueChange={setGranularity}
          renderHeading={(list) => (
            <div
              className={css({
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "8px",
              })}
            >
              <h2 className={css({ m: 0, textStyle: "serif", fontSize: "32px", lineHeight: 1 })}>
                Au fil du temps
              </h2>
              {list}
            </div>
          )}
          items={(["month", "week", "year"] as const).map((g) => ({
            value: g,
            label: g === "month" ? "Par mois" : g === "week" ? "Par semaine" : "Par an",
            content: (
              <div className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
                <LastPeriods bars={bars[g]} />
                <span className={css({ fontSize: "12px", color: "muted" })}>{CAPTIONS[g]}</span>
              </div>
            ),
          }))}
        />
      </section>
    </Main>
  );
}
