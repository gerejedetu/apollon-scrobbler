import type { ReactNode } from "react";
import { css } from "styled-system/css";
import type { Diversity, OneShots, Sessions, Streaks } from "../../api/index.ts";
import {
  formatCount,
  formatDayMonth,
  formatDays,
  formatDuration,
  formatMonthYear,
  formatShare,
  parseDay,
} from "../../lib/format/index.ts";
import { Caps } from "../../ui/primitives/index.ts";

const card = css({ p: "24px", bg: "panel", display: "flex", flexDirection: "column", gap: "14px" });
const big = css({ textStyle: "narrow", fontSize: "56px", lineHeight: 0.9 });
const note = css({ fontSize: "12px", color: "muted" });

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className={css({ display: "flex", justifyContent: "space-between", gap: "12px" })}>
      <span className={css({ color: "muted" })}>{label}</span>
      <span>{children}</span>
    </span>
  );
}

/** Current streak with the last 30 days as dots (black: active, violet: today). */
export function StreakCard({
  streaks,
  last30,
}: {
  streaks: Streaks;
  last30: { date: string; listenCount: number }[];
}) {
  const { current, longest } = streaks;
  const toBeat = (longest?.days ?? 0) - current.days + 1;
  return (
    <div className={card}>
      <Caps>SÉRIE EN COURS</Caps>
      <span className={big}>{formatDays(current.days)}</span>
      <div
        role="img"
        aria-label={`${last30.filter((d) => d.listenCount > 0).length} jours actifs sur les 30 derniers`}
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
          gap: "4px",
        })}
      >
        {last30.map((d, i) => (
          <span
            key={d.date}
            className={css({ aspectRatio: "1", borderRadius: "50%" })}
            style={{
              background:
                i === last30.length - 1 && d.listenCount > 0
                  ? "#6E44FF"
                  : d.listenCount > 0
                    ? "#111111"
                    : "#DADADA",
            }}
          />
        ))}
      </div>
      <span className={note}>
        {longest && longest.days > current.days
          ? `Record : ${formatDays(longest.days)}, en ${formatMonthYear(parseDay(longest.from).getTime() / 1000)}. Encore ${toBeat} pour le battre.`
          : current.days > 0
            ? "C'est ton record. Continue."
            : "Pas encore de série : une écoute aujourd'hui la lance."}
      </span>
    </div>
  );
}

/** How much the top artist and the top 10 weigh, as a ring. */
export function DiversityCard({
  diversity,
  topArtist,
}: {
  diversity: Diversity;
  topArtist?: string;
}) {
  if (diversity.listenCount === 0) return null;
  // The API gives shares in percent (25.7), the formatters want fractions.
  const top = diversity.topArtistShare / 100;
  const top10 = diversity.top10ArtistShare / 100;
  const others = Math.max(0, diversity.artistCount - 10);
  const a = Math.round(top * 100);
  const b = Math.round(top10 * 100);
  return (
    <div className={card}>
      <Caps>DIVERSITÉ</Caps>
      <div className={css({ display: "flex", alignItems: "center", gap: "20px" })}>
        <div
          role="img"
          aria-label={`Top 10 : ${formatShare(top10, 0)} des écoutes`}
          className={css({
            width: "112px",
            height: "112px",
            flexShrink: 0,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
          style={{
            background: `conic-gradient(#111111 0 ${a}%, #F7B52C ${a}% ${b}%, #DADADA ${b}% 100%)`,
          }}
        >
          <span
            className={css({
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              bg: "panel",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textStyle: "narrow",
              fontSize: "22px",
            })}
          >
            {formatShare(top10, 0)}
          </span>
        </div>
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "12px",
          })}
        >
          <Legend color="#111111">
            {topArtist ?? "1er artiste"} · {formatShare(top, 0)}
          </Legend>
          <Legend color="#F7B52C">Top 2 à 10 · {formatShare(top10 - top, 0)}</Legend>
          {others > 0 ? (
            <Legend color="#DADADA">
              {formatCount(others)} autres · {formatShare(1 - top10, 0)}
            </Legend>
          ) : null}
        </div>
      </div>
      <span className={note}>
        {top10 >= 0.5
          ? `Ton top 10 pèse ${top10 >= 0.6 ? "plus" : "un peu plus"} de la moitié de tes écoutes.`
          : "Ton top 10 pèse moins de la moitié de tes écoutes."}
      </span>
    </div>
  );
}

function Legend({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className={css({ display: "flex", alignItems: "center", gap: "6px" })}>
      <span className={css({ width: "10px", height: "10px" })} style={{ background: color }} />
      {children}
    </span>
  );
}

/** Sessions: count, average length and size, the longest, and tracks heard once. */
export function SessionsCard({ sessions, oneShots }: { sessions: Sessions; oneShots: OneShots }) {
  return (
    <div className={card}>
      <Caps>SESSIONS</Caps>
      <span className={big}>{formatCount(sessions.sessionCount)}</span>
      <div
        className={css({ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" })}
      >
        <Line label="Durée moyenne">{formatDuration(sessions.averageDurationSeconds)}</Line>
        <Line label="Titres par session">{Math.round(sessions.averageListens)}</Line>
        {sessions.longest ? (
          <Line label="La plus longue">
            {formatDuration(sessions.longest.endedAt - sessions.longest.startedAt)}, le{" "}
            {formatDayMonth(sessions.longest.startedAt)}
          </Line>
        ) : null}
        <Line label="Écoutés une seule fois">{formatCount(oneShots.total)} titres</Line>
      </div>
    </div>
  );
}
