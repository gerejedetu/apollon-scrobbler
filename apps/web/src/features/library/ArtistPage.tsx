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
import { m } from "../../paraglide/messages.js";

type Granularity = Timeline["granularity"];

const CAPTIONS: Record<Granularity, () => string> = {
  month: m.timeline_caption_month,
  week: m.timeline_caption_week,
  year: m.timeline_caption_year,
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
            {m.tab_profile()}
          </Link>,
          <Link key="a" to="/u/$userName/tops/$kind" params={{ userName, kind: "artistes" }}>
            {m.tab_artists()}
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
          <EntityTitle kind={m.caps_artist()} title={artist.artist} size={36} />
          <div className={css({ display: "flex", flexWrap: "wrap", gap: "28px" })}>
            <Stat value={formatCount(artist.listenCount)} label={m.caps_listens()} />
            <Stat value={formatCount(artist.trackCount)} label={m.caps_tracks()} />
            <Stat value={formatCount(artist.albumCount)} label={m.caps_albums()} />
            {artist.firstListenedAt ? (
              <Stat value={formatDate(artist.firstListenedAt)} label={m.caps_first_listen()} />
            ) : null}
            {artist.lastListenedAt ? (
              <Stat value={formatAgo(artist.lastListenedAt)} label={m.caps_last()} />
            ) : null}
          </div>
          <div className={css({ alignSelf: "flex-start" })}>
            <SelectMenu<Range>
              label={m.period()}
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
            title={m.most_played_tracks()}
            aside={m.n_of_tracks({
              shown: artist.topTracks.length,
              count: formatCount(artist.trackCount),
            })}
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
          <h2 className={css({ m: 0, textStyle: "block" })}>{m.facts()}</h2>
          {record ? (
            <span className={css({ display: "flex", justifyContent: "space-between" })}>
              <span className={css({ color: "muted" })}>{m.record_month()}</span>
              <span>
                {formatPeriodMonth(record.period)} · {formatCount(record.listenCount)}
              </span>
            </span>
          ) : null}
          {summary.listenCount > 0 ? (
            <span className={css({ display: "flex", justifyContent: "space-between" })}>
              <span className={css({ color: "muted" })}>{m.share_of_listens()}</span>
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
              {m.view_musicbrainz()}
              <ArrowUpRight />
            </a>
          ) : null}
        </aside>
      </div>

      {artist.albums.length > 0 ? (
        <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
          <BlockHeading title={m.tab_albums()} aside={m.albums_order()} />
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
                    {m.count_listens({ count: formatCount(a.listenCount) })} ·{" "}
                    {m.count_tracks({ count: a.trackCount })}
                  </span>
                  <span className={css({ color: "muted" })}>
                    {m.from_to({
                      from: formatPeriodMonth(monthKey(a.firstListenedAt)),
                      to: formatPeriodMonth(monthKey(a.lastListenedAt)),
                    })}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
        <TextTabs<Granularity>
          label={m.scale()}
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
                {m.over_time()}
              </h2>
              {list}
            </div>
          )}
          items={(["month", "week", "year"] as const).map((g) => ({
            value: g,
            label: g === "month" ? m.by_month() : g === "week" ? m.by_week() : m.by_year(),
            content: (
              <div className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
                <LastPeriods bars={bars[g]} />
                <span className={css({ fontSize: "12px", color: "muted" })}>{CAPTIONS[g]()}</span>
              </div>
            ),
          }))}
        />
      </section>
    </Main>
  );
}
