import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { css } from "styled-system/css";
import type { ArtistPage as Artist, Range, Summary, Timeline } from "../../api/index.ts";
import {
  barWidth,
  formatAgo,
  formatCount,
  formatDate,
  formatPeriodMonth,
  formatShare,
  monthKey,
} from "../../lib/format/index.ts";
import { RANGES } from "../../lib/ranges.ts";
import { Cover } from "../../ui/cover/index.ts";
import { ArrowUpRight } from "../../ui/icons.tsx";
import { Breadcrumbs, Main } from "../../ui/layout/index.ts";
import { BlockHeading, pill, Stat } from "../../ui/primitives/index.ts";
import { TextTabs } from "../../ui/zag/index.ts";
import { albumSeed, artistSeed } from "../listens/index.ts";
import { EntityTitle, PeriodBars, recordOf } from "./shared.tsx";

type Granularity = Timeline["granularity"];

const ARTIST_RANGES: Range[] = ["this_month", "this_year", "year", "all_time"];

const periodLabel: Record<Granularity, (p: string) => string> = {
  month: formatPeriodMonth,
  week: (p) => p,
  year: (p) => p.slice(0, 4),
};

export interface ArtistData {
  artist: Artist;
  timelines: Record<Granularity, Timeline>;
  summary: Summary;
}

/** An artist: totals, period pills, the timeline, albums, most played tracks and a few facts. */
export function ArtistPage({
  userName,
  range,
  data,
}: {
  userName: string;
  range: Range;
  data: ArtistData;
}) {
  const { artist, timelines, summary } = data;
  const [granularity, setGranularity] = useState<Granularity>("month");
  const record = recordOf(timelines.month.periods);
  const maxTrack = artist.topTracks[0]?.listenCount ?? 0;
  const mbid = artist.mbids?.[0];

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
        <Cover seed={artistSeed(artist.artist)} round size={200} />
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
          <div
            role="tablist"
            aria-label="Période"
            className={css({ display: "flex", flexWrap: "wrap", gap: "6px" })}
          >
            {ARTIST_RANGES.map((r) => (
              <Link
                key={r}
                to="/u/$userName/artistes/$artist"
                params={{ userName, artist: artist.artist }}
                search={{ periode: r }}
                role="tab"
                aria-selected={r === range}
                className={pill({ tone: r === range ? "on" : "off" })}
                resetScroll={false}
              >
                {RANGES.find((x) => x.value === r)?.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

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
                <PeriodBars
                  periods={timelines[g].periods}
                  height={140}
                  format={periodLabel[g]}
                  label={`Écoutes de ${artist.artist} au fil du temps`}
                />
              </div>
            ),
          }))}
        />
      </section>

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
                <Cover seed={albumSeed(artist.artist, a.album)} mbid={a.releaseMbid} />
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
                    de{" "}
                    {formatPeriodMonth(
                      new Date(a.firstListenedAt * 1000).toISOString().slice(0, 7),
                    )}{" "}
                    à {formatPeriodMonth(monthKey(a.lastListenedAt))}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
          })}
        >
          <div
            className={css({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              pb: "10px",
            })}
          >
            <h2 className={css({ m: 0, textStyle: "block" })}>Titres les plus écoutés</h2>
            <span className={css({ fontSize: "12px", color: "muted" })}>
              {artist.topTracks.length} sur {formatCount(artist.trackCount)} titres
            </span>
          </div>
          {artist.topTracks.map((t, i) => (
            <Link
              key={`${t.track}/${t.album}`}
              to="/u/$userName/titres/$artist/$track"
              params={{ userName, artist: artist.artist, track: t.track }}
              search={{ album: t.album ?? undefined }}
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "14px",
                py: "10px",
                borderTop: "1px solid token(colors.ruleSoft)",
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
              <Cover seed={albumSeed(artist.artist, t.album)} size={36} />
              <span
                className={css({
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                })}
              >
                <span className={css({ fontSize: "13px", fontWeight: "500" })}>{t.track}</span>
                {t.album ? (
                  <span className={css({ fontSize: "12px", color: "muted" })}>
                    <i>{t.album}</i>
                  </span>
                ) : null}
              </span>
              <span
                className={css({ width: "120px", height: "6px", bg: "ruleSoft", hideBelow: "sm" })}
              >
                <span
                  className={css({ display: "block", height: "6px", bg: "ink" })}
                  style={{ width: barWidth(t.listenCount, maxTrack) }}
                />
              </span>
              <span
                className={css({
                  width: "40px",
                  textAlign: "right",
                  fontSize: "12px",
                  color: "muted",
                })}
              >
                {formatCount(t.listenCount)}
              </span>
            </Link>
          ))}
        </section>

        <aside
          className={css({
            flex: "1 1 240px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          })}
        >
          <section
            className={css({
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
          </section>
        </aside>
      </div>
    </Main>
  );
}
