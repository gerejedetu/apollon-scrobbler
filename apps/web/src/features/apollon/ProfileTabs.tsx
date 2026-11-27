import type { Favourite, Listen } from "../../api/index.ts";
import { formatDate } from "../../lib/format/index.ts";
import {
  Button,
  Columns,
  InsightCard,
  LaurelGrid,
  ObsessionTile,
  Page,
  PageTitle,
  SectionHeader,
  StatInline,
  TrackList,
} from "../../ui/apollon/index.ts";
import { useFavourites } from "../favourites/index.ts";
import { m } from "../../paraglide/messages.js";
import type { Laurel } from "./laurels.ts";
import { artistLinks, coverUrl, playHref, trackHref } from "./links.ts";

/** Coups de cœur (design system: PageLoved): every loved track, newest first, the most loved artist aside. */
export function LovedPage({
  userName,
  loved,
  total,
}: {
  userName: string;
  loved: Favourite[];
  total: number;
}) {
  const fav = useFavourites();
  // The list shows the loved tracks as listens stamped with when they were loved.
  const rows = loved
    .filter((t) => fav.isLoved(t))
    .map((t) => ({
      ...t,
      id: `${t.artist}/${t.track}`,
      listenedAt: t.lovedAt ?? 0,
      insertedAt: t.lovedAt ?? 0,
    }));
  const byArtist = new Map<string, number>();
  for (const t of loved) byArtist.set(t.artist, (byArtist.get(t.artist) ?? 0) + 1);
  const [topArtist, topCount] = [...byArtist.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  return (
    <Page>
      <Columns
        main={[
          <PageTitle key="t" title={m.ds_tab_loved_long()} count={total} />,
          <TrackList
            key="l"
            listens={rows}
            readOnly={!fav.owner}
            isLoved={() => true}
            onToggleLove={(t: Listen) => void fav.toggleLove(t)}
            coverFor={(t: Listen) => coverUrl(t)}
            titleHref={(t: Favourite) => trackHref(userName, t)}
            artistLinks={(t: Favourite) => artistLinks(userName, t.artist)}
            playHref={(t: Favourite) => playHref(t)}
          />,
          rows.length === 0 ? (
            <p key="e" className="ap-detail__lead">
              {m.ds_loved_empty()}
            </p>
          ) : null,
        ].filter(Boolean)}
        side={
          topArtist
            ? [
                <InsightCard
                  key="i"
                  label={m.ds_most_loved_artist()}
                  value={topArtist}
                  caption={m.ds_loved_of({ count: topCount ?? 0, total })}
                />,
              ]
            : []
        }
      />
    </Page>
  );
}

type Obsession = Favourite & { id: number; until: number | null };

/** Obsessions (design system: PageObsessions): the current one first, then the earlier ones, the longest marked. */
export function ObsessionsPage({
  userName,
  items,
  total,
  longest,
  candidate,
}: {
  userName: string;
  items: Obsession[];
  total: number;
  longest: Obsession | null;
  candidate: Favourite | null;
}) {
  const fav = useFavourites();
  const now = Math.floor(Date.now() / 1000);
  const days = (o: Obsession) =>
    Math.max(1, Math.round(((o.until ?? now) - (o.since ?? now)) / 86_400));
  return (
    <Page>
      <PageTitle
        title={m.ds_your_obsessions()}
        count={total}
        actions={
          fav.owner && candidate && !fav.isObsession(candidate) ? (
            <Button variant="primary" onClick={() => void fav.toggleObsession(candidate)}>
              {m.ds_its_my_obsession()}
            </Button>
          ) : undefined
        }
      />
      {longest ? (
        <StatInline
          stats={[
            { label: m.ds_obsessions_count(), value: total },
            { label: m.ds_longest_obsession(), value: m.ds_days_long({ n: days(longest) }) },
          ]}
        />
      ) : null}
      <div className="ap-lib__gap" />
      {items.length ? (
        <div className="ap-obstiles">
          {items
            .filter((o) => !fav.isRemovedObsession(o.id))
            .map((o) => (
              <div key={o.id} className="ap-obstile-wrap">
                <ObsessionTile
                  now={now}
                  current={o.until === null}
                  longest={longest !== null && longest.id === o.id}
                  obsession={o}
                  coverUrl={coverUrl(o, 500)}
                  href={trackHref(userName, o)}
                />
                {fav.owner ? (
                  <div className="ap-obstile-wrap__remove">
                    <Button
                      variant="light"
                      size="sm"
                      icon="trash"
                      aria-label={`${m.obsession_remove()} : ${o.track}`}
                      onClick={() => void fav.removeObsession(o)}
                    >
                      {m.obsession_remove()}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
        </div>
      ) : (
        <p className="ap-detail__lead">{m.ds_obsessions_empty()}</p>
      )}
    </Page>
  );
}

/** Lauriers (design system: PageLaurels): the ones earned, then the ones on the way. */
export function LaurelsPage({ laurels }: { laurels: Laurel[] }) {
  const earned = laurels.filter((l) => !l.progress);
  const pending = laurels.filter((l) => l.progress);
  const latest = earned
    .filter((l) => l.earnedAt)
    .sort((a, b) => (b.earnedAt ?? 0) - (a.earnedAt ?? 0))[0];
  return (
    <Page>
      <PageTitle title={m.ds_tab_laurels()} count={earned.length} />
      <StatInline
        stats={[
          { label: m.ds_laurels_earned(), value: earned.length },
          { label: m.ds_laurels_pending(), value: pending.length },
          ...(latest?.earnedAt
            ? [{ label: m.ds_laurels_latest(), value: formatDate(latest.earnedAt) }]
            : []),
        ]}
      />
      <div className="ap-lib__gap" />
      <SectionHeader title={m.ds_laurels_earned_title()} size="sm" showPeriod={false} />
      <LaurelGrid items={earned} />
      {pending.length ? (
        <>
          <div className="ap-lib__gap" />
          <SectionHeader title={m.ds_laurels_pending_title()} size="sm" showPeriod={false} />
          <LaurelGrid items={pending} />
        </>
      ) : null}
    </Page>
  );
}
