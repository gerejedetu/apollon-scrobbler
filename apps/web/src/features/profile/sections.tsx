import { Link, useNavigate } from "@tanstack/react-router";
import { css, cx } from "styled-system/css";
import type {
  Listen,
  Milestones,
  NowPlaying,
  OnRepeat,
  Range,
  Streaks,
  Top,
} from "../../api/index.ts";
import {
  formatCount,
  formatDayString,
  formatDayStringWithYear,
  formatDays,
  formatDate,
  formatMilestone,
} from "../../lib/format/index.ts";
import { RANGES, rangeLabel } from "../../lib/ranges.ts";
import { AxisLabels, Bars } from "../../ui/charts/index.ts";
import { Cover } from "../../ui/cover/index.ts";
import { ChevronDown, ChevronRight } from "../../ui/icons.tsx";
import { BlockHeading, CountBadge, Empty, Stat } from "../../ui/primitives/index.ts";
import { albumSeed, ListenItem, ListenRow } from "../listens/index.ts";
import { AlbumCard, coverGrid } from "./cards.tsx";

const stack14 = css({ display: "flex", flexDirection: "column", gap: "14px" });
const stack12 = css({ display: "flex", flexDirection: "column", gap: "12px" });

/** "Top albums" with the period picker ("Période : Ce mois-ci ⌄"). */
export function TopAlbums({ userName, top, range }: { userName: string; top: Top; range: Range }) {
  const navigate = useNavigate();
  return (
    <section className={stack14}>
      <BlockHeading
        title="Top albums"
        aside={
          <label
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "4px",
              position: "relative",
            })}
          >
            Période :<b className={css({ color: "ink", fontWeight: "500" })}>{rangeLabel(range)}</b>
            <ChevronDown />
            <select
              aria-label="Période du top"
              value={range}
              onChange={(e) =>
                void navigate({
                  to: "/u/$userName",
                  params: { userName },
                  search: { periode: e.target.value as Range },
                  resetScroll: false,
                })
              }
              className={css({ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" })}
            >
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        }
      />
      {top.items.length === 0 ? (
        <Empty>Aucune écoute sur cette période.</Empty>
      ) : (
        <div className={coverGrid}>
          {top.items.map((item, i) => (
            <AlbumCard
              key={`${item.artist}/${item.album}`}
              userName={userName}
              rank={i + 1}
              artist={item.artist}
              album={item.album ?? "?"}
              mbid={item.mbids?.release}
              plays={item.listenCount}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** "En boucle": tracks played much more in the last 30 days than in the 30 before. */
export function Rotation({ userName, onRepeat }: { userName: string; onRepeat: OnRepeat }) {
  if (onRepeat.items.length === 0) return null;
  return (
    <section className={stack14}>
      <BlockHeading title="En boucle" aside="30 derniers jours vs les 30 d'avant" />
      <div className={coverGrid}>
        {onRepeat.items.map((item) => (
          <AlbumCard
            key={`${item.artistName}/${item.trackName}`}
            userName={userName}
            artist={item.artistName}
            album={item.releaseName ?? item.trackName ?? item.artistName}
            title={item.trackName ?? undefined}
            plays={item.current}
            badge={
              <span
                className={css({
                  flexShrink: 0,
                  px: "4px",
                  py: "1px",
                  bg: "chip",
                  fontSize: "9px",
                  fontWeight: "600",
                  color: "muted",
                })}
              >
                +{item.change}
              </span>
            }
          />
        ))}
      </div>
    </section>
  );
}

/** "Écoutes récentes": what is playing, then the last listens. */
export function RecentListens({
  userName,
  listens,
  nowPlaying,
}: {
  userName: string;
  listens: Listen[];
  nowPlaying: NowPlaying["nowPlaying"];
}) {
  return (
    <section className={css({ display: "flex", flexDirection: "column" })}>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          pb: "10px",
        })}
      >
        <h2 className={css({ m: 0, textStyle: "block" })}>Écoutes récentes</h2>
        <Link
          to="/u/$userName/historique"
          params={{ userName }}
          className={css({
            fontSize: "13px",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "2px",
          })}
        >
          Tout l'historique
          <ChevronRight />
        </Link>
      </div>
      {nowPlaying ? <ListenRow track={nowPlaying} when="en écoute" playing /> : null}
      {listens.length === 0 && !nowPlaying ? (
        <Empty>Pas encore d'écoute. Crée un token et branche ton lecteur.</Empty>
      ) : (
        listens.map((l) => <ListenItem key={`${l.listenedAt}/${l.id}`} listen={l} />)
      )}
    </section>
  );
}

/** Side card "En écoute" with the three moving bars. */
export function NowPlayingCard({ nowPlaying }: { nowPlaying: NowPlaying["nowPlaying"] }) {
  if (!nowPlaying) return null;
  return (
    <section className={stack12}>
      <h2 className={css({ m: 0, textStyle: "block" })}>En écoute</h2>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "12px",
          p: "10px",
          bg: "panel",
          borderRadius: "field",
        })}
      >
        <Cover
          seed={albumSeed(nowPlaying.artist, nowPlaying.album)}
          mbid={nowPlaying.mbids?.release}
          size={48}
        />
        <div
          className={css({
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          })}
        >
          <span className={css({ fontSize: "13px", fontWeight: "500" })}>{nowPlaying.track}</span>
          <span className={css({ fontSize: "12px", color: "muted" })}>
            {[nowPlaying.artist, nowPlaying.album].filter(Boolean).join(" · ")}
          </span>
        </div>
        <span
          role="img"
          aria-label="En cours"
          className={css({
            display: "inline-flex",
            alignItems: "flex-end",
            gap: "2px",
            height: "12px",
          })}
        >
          {[6, 12, 9].map((h, i) => (
            <span key={i} className={css({ width: "3px", bg: "violet" })} style={{ height: h }} />
          ))}
        </span>
      </div>
    </section>
  );
}

/** "Paliers": the 1st, 1 000th, 10 000th listen… and the next one. */
export function MilestoneList({ milestones }: { milestones: Milestones }) {
  if (milestones.items.length === 0) return null;
  const items = [...milestones.items].sort((a, b) => b.n - a.n).slice(0, 4);
  return (
    <section className={stack12}>
      <h2 className={css({ m: 0, textStyle: "block" })}>Paliers</h2>
      {items.map((m) => (
        <div
          key={m.n}
          className={css({
            display: "flex",
            gap: "10px",
            pb: "10px",
            borderBottom: "1px solid token(colors.ruleSoft)",
          })}
        >
          <span
            className={css({ width: "56px", flexShrink: 0, fontSize: "13px", fontWeight: "600" })}
          >
            {formatMilestone(m.n)}
          </span>
          <span className={css({ fontSize: "13px", lineHeight: "18px" })}>
            <i className={css({ fontWeight: "600" })}>{m.trackName}</i> · {m.artistName}
            <br />
            <span className={css({ color: "muted" })}>{formatDate(m.listenedAt)}</span>
          </span>
        </div>
      ))}
      {milestones.next ? (
        <span className={css({ fontSize: "12px", color: "muted" })}>
          Prochain palier :{" "}
          <b className={css({ color: "ink", fontWeight: "600" })}>{formatCount(milestones.next)}</b>
          , dans {formatCount(milestones.next - milestones.listenCount)} écoutes
        </span>
      ) : null}
    </section>
  );
}

/** "Écoutes" over the last 14 days. */
export function RecentActivity({ days }: { days: { date: string; listenCount: number }[] }) {
  const total = days.reduce((sum, d) => sum + d.listenCount, 0);
  return (
    <section
      className={cx(stack12, css({ pt: "16px", borderTop: "1px solid token(colors.rule)" }))}
    >
      <h2
        className={css({
          m: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textStyle: "block",
        })}
      >
        Écoutes <CountBadge>{formatCount(total)}</CountBadge>
      </h2>
      <Bars
        height={64}
        label={`Écoutes des ${days.length} derniers jours`}
        bars={days.map((d) => ({
          value: d.listenCount,
          label: `${formatDayString(d.date)} : ${d.listenCount}`,
        }))}
      />
      <AxisLabels items={[`il y a ${days.length} j`, "aujourd'hui"]} />
    </section>
  );
}

/** Current streak and record. */
export function StreakFigures({ streaks }: { streaks: Streaks }) {
  const { current, longest } = streaks;
  return (
    <section
      className={css({
        display: "flex",
        gap: "28px",
        pt: "16px",
        borderTop: "1px solid token(colors.rule)",
      })}
    >
      <Stat
        value={formatDays(current.days)}
        label="SÉRIE EN COURS"
        note={current.since ? `depuis le ${formatDayString(current.since)}` : undefined}
      />
      <Stat
        value={formatDays(longest?.days ?? 0)}
        label="RECORD"
        note={
          longest
            ? `${formatDayString(longest.from)} – ${formatDayStringWithYear(longest.to)}`
            : undefined
        }
      />
    </section>
  );
}
