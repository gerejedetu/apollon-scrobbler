/**
 * Laurels (design system: LaurelBadge): rewards earned by listening, worked out from the API's counts.
 * Laurier for the usual steps, or (gold) for the rare ones; an unearned one carries its progress.
 */
import { api } from "../../api/index.ts";
import { utcOffset } from "../../lib/timezone.ts";
import { m } from "../../paraglide/messages.js";

export interface Laurel {
  title: string;
  description?: string;
  value: string;
  tier: "laurel" | "gold";
  earnedAt?: number | null;
  progress?: { current: number; target: number };
}

export async function loadLaurels(userName: string): Promise<Laurel[]> {
  const offset = utcOffset();
  const [milestones, summary, streaks, sessions, topArtist, albumSessions, obsessions] =
    await Promise.all([
      api.stats.milestones(userName),
      api.stats.summary(userName, { range: "all_time", utcOffset: offset }),
      api.stats.streaks(userName, { utcOffset: offset }),
      api.stats.sessions(userName, { range: "all_time" }),
      api.stats.top(userName, "artists", { range: "all_time", limit: 1 }),
      api.stats.albumSessions(userName, { limit: 1 }).catch(() => null),
      api.favourites.obsessions(userName, { limit: 1 }).catch(() => null),
    ]);
  const at = (n: number) => milestones.items.find((i) => i.n === n);
  const count = (n: number, tier: Laurel["tier"], title: string): Laurel => {
    const reached = at(n);
    return {
      title,
      description: reached
        ? m.ds_laurel_count_done({
            n: n.toLocaleString(),
            track: reached.trackName,
            artist: reached.artistName,
          })
        : m.ds_laurel_count({ n: n.toLocaleString() }),
      value: String(n),
      tier,
      earnedAt: reached?.listenedAt ?? null,
      progress: reached ? undefined : { current: summary.listenCount, target: n },
    };
  };
  const first = at(1);
  const longestStreak = streaks.longest?.days ?? 0;
  const marathon = sessions.longest?.listenCount ?? 0;
  const fan = topArtist.items[0];
  const album = albumSessions?.items[0];
  const kept = obsessions?.longest
    ? Math.floor(
        ((obsessions.longest.until ?? Date.now() / 1000) - (obsessions.longest.since ?? 0)) /
          86_400,
      )
    : 0;
  const threshold = (
    title: string,
    description: string,
    value: string,
    tier: Laurel["tier"],
    current: number,
    target: number,
    earnedAt?: number | null,
  ): Laurel => ({
    title,
    description,
    value,
    tier,
    earnedAt: current >= target ? (earnedAt ?? null) : null,
    progress: current >= target ? undefined : { current, target },
  });
  return [
    {
      title: m.ds_laurel_first(),
      description: first
        ? m.ds_laurel_first_desc({ track: first.trackName, artist: first.artistName })
        : undefined,
      value: "1",
      tier: "laurel",
      earnedAt: first?.listenedAt ?? null,
      progress: first ? undefined : { current: 0, target: 1 },
    },
    count(100, "laurel", m.ds_laurel_100()),
    count(500, "gold", m.ds_laurel_500()),
    count(1000, "gold", m.ds_laurel_1000()),
    count(10000, "gold", m.ds_laurel_10000()),
    threshold(
      m.ds_laurel_marathon(),
      m.ds_laurel_marathon_desc(),
      "40",
      "laurel",
      marathon,
      40,
      sessions.longest?.startedAt,
    ),
    threshold(
      m.ds_laurel_week(),
      m.ds_laurel_week_desc(),
      m.ds_days_short({ n: 7 }),
      "laurel",
      longestStreak,
      7,
    ),
    threshold(
      m.ds_laurel_month(),
      m.ds_laurel_month_desc(),
      m.ds_days_short({ n: 30 }),
      "gold",
      longestStreak,
      30,
    ),
    threshold(
      m.ds_laurel_fan(),
      fan ? m.ds_laurel_fan_desc({ artist: fan.artist }) : m.ds_laurel_fan_any(),
      "100",
      "gold",
      fan?.listenCount ?? 0,
      100,
    ),
    threshold(
      m.ds_laurel_explorer(),
      m.ds_laurel_explorer_desc({ n: 100 }),
      "100",
      "laurel",
      summary.artistCount,
      100,
    ),
    threshold(
      m.ds_laurel_encyclopedia(),
      m.ds_laurel_explorer_desc({ n: 500 }),
      "500",
      "gold",
      summary.artistCount,
      500,
    ),
    threshold(
      m.ds_laurel_album(),
      album ? m.ds_laurel_album_desc({ album: album.releaseName }) : m.ds_laurel_album_any(),
      album ? String(album.trackCount) : "1",
      "laurel",
      albumSessions?.total ?? 0,
      1,
      album?.endedAt,
    ),
    threshold(
      m.ds_laurel_obsessed(),
      m.ds_laurel_obsessed_desc(),
      m.ds_days_short({ n: 30 }),
      "laurel",
      kept,
      30,
    ),
  ];
}
