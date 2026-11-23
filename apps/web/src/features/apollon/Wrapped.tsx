import { useNavigate } from "@tanstack/react-router";
import type { Wrapped } from "../../api/index.ts";
import { formatCount, formatDayMonth, formatDuration } from "../../lib/format/index.ts";
import { dateFormat } from "../../lib/locale.ts";
import {
  InsightCard,
  Page,
  RankedList,
  SectionHeader,
  WrappedHero,
} from "../../ui/apollon/index.ts";
import { m } from "../../paraglide/messages.js";

/** The year in review (design system: PageWrapped): the gold opening, three top fives, three highlights. */
export function WrappedReview({
  userName,
  wrapped: w,
  firstYear,
}: {
  userName: string;
  wrapped: Wrapped;
  firstYear: number;
}) {
  const navigate = useNavigate();
  const thisYear = new Date().getUTCFullYear();
  const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => String(thisYear - i));
  const discovery = w.topDiscoveries[0];
  const month = w.busiestMonth
    ? dateFormat({ month: "long", timeZone: "UTC" }).format(
        new Date(`${w.busiestMonth.month}-01T00:00:00Z`),
      )
    : null;
  return (
    <>
      <WrappedHero
        userName={userName}
        data={{
          ...w,
          busiestDay: w.busiestDay ?? undefined,
          favouriteHour: w.favouriteHour ?? undefined,
        }}
      />
      <Page>
        {years.length > 1 ? (
          <SectionHeader
            title={m.ds_year_in_review({ year: w.year })}
            size="sm"
            periods={years.map((y) => ({ value: y, label: y }))}
            period={String(w.year)}
            onPeriodChange={(v: string) =>
              void navigate({
                to: "/u/$userName/retrospective",
                params: { userName },
                search: { annee: Number(v) },
              })
            }
          />
        ) : null}
        {w.listenCount === 0 ? (
          <p className="ap-detail__lead">{m.wrapped_empty()}</p>
        ) : (
          <>
            <div className="ap-wr__grid3">
              <section>
                <SectionHeader title={m.tab_artists()} size="sm" showPeriod={false} />
                <RankedList
                  items={w.topArtists
                    .slice(0, 5)
                    .map((a) => ({ title: a.artist, listenCount: a.listenCount }))}
                />
              </section>
              <section>
                <SectionHeader title={m.tab_tracks()} size="sm" showPeriod={false} />
                <RankedList
                  items={w.topTracks
                    .slice(0, 5)
                    .map((t) => ({ title: t.track, sub: t.artist, listenCount: t.listenCount }))}
                />
              </section>
              <section>
                <SectionHeader title={m.tab_albums()} size="sm" showPeriod={false} />
                <RankedList
                  items={w.topAlbums
                    .slice(0, 5)
                    .map((a) => ({ title: a.album, sub: a.artist, listenCount: a.listenCount }))}
                />
              </section>
            </div>
            <div className="ap-lib__gap" />
            <div className="ap-wr__grid3 ap-wr__grid3--tight">
              <InsightCard
                label={m.ds_discoveries()}
                value={formatCount(w.newArtists)}
                unit={m.ds_artists_unit()}
                caption={
                  discovery
                    ? m.ds_discovery_caption({
                        artist: discovery.artistName,
                        date: formatDayMonth(discovery.firstListenedAt),
                      })
                    : undefined
                }
              />
              {w.longestSession ? (
                <InsightCard
                  label={m.moment_longest_session()}
                  value={formatCount(w.longestSession.listenCount)}
                  unit={m.ds_plays_unit()}
                  caption={m.ds_session_caption({
                    date: formatDayMonth(w.longestSession.startedAt),
                    duration: formatDuration(w.longestSession.endedAt - w.longestSession.startedAt),
                  })}
                />
              ) : null}
              {w.busiestMonth && month ? (
                <InsightCard
                  label={m.moment_busiest_month()}
                  value={formatCount(w.busiestMonth.listenCount)}
                  unit={m.ds_plays_unit()}
                  caption={month.charAt(0).toUpperCase() + month.slice(1)}
                />
              ) : null}
            </div>
          </>
        )}
      </Page>
    </>
  );
}
